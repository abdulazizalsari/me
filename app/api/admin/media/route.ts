import { lookup } from "node:dns/promises";
import net from "node:net";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { listMediaAssets, saveMediaAsset } from "@/lib/cms/database";
import { supabaseStorageUpload, supabaseStorageDelete } from "@/lib/supabase-rest";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);
const maxBytes = 5 * 1024 * 1024;
const mimeByFormat: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif"
};

function isPrivateIp(address: string) {
  if (net.isIP(address) === 6) {
    return address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:");
  }
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || a === 0;
}

async function assertPublicRemoteUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("رابط الصورة غير صالح.");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("يجب أن يبدأ الرابط بـ http أو https.");
  const records = await lookup(url.hostname, { all: true });
  if (!records.length || records.some((record) => isPrivateIp(record.address))) {
    throw new Error("لا يمكن استيراد صور من عناوين داخلية أو خاصة.");
  }
  return url;
}

export async function GET() {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  return NextResponse.json({ ok: true, media: await listMediaAssets() });
}

export async function POST(request: Request) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const remoteUrl = String(formData.get("remoteUrl") || "").trim();

  let buffer: Buffer;
  let filename: string;
  let declaredType: string;
  let sourceSize: number;

  if (file instanceof File) {
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ ok: false, message: "صيغة الملف غير مدعومة." }, { status: 400 });
    }
    if (file.size > maxBytes) {
      return NextResponse.json({ ok: false, message: "حجم الصورة أكبر من الحد المسموح." }, { status: 400 });
    }
    buffer = Buffer.from(await file.arrayBuffer());
    filename = file.name;
    declaredType = file.type;
    sourceSize = file.size;
  } else if (remoteUrl) {
    let url: URL;
    try {
      url = await assertPublicRemoteUrl(remoteUrl);
    } catch (error) {
      return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "رابط الصورة غير صالح." }, { status: 400 });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal, redirect: "error" });
    } catch {
      clearTimeout(timeout);
      return NextResponse.json({ ok: false, message: "تعذر تحميل الصورة من الرابط." }, { status: 400 });
    }
    clearTimeout(timeout);
    if (!response.ok) return NextResponse.json({ ok: false, message: "تعذر تحميل الصورة من الرابط." }, { status: 400 });
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > maxBytes) return NextResponse.json({ ok: false, message: "حجم الصورة أكبر من الحد المسموح." }, { status: 400 });
    declaredType = response.headers.get("content-type")?.split(";")[0] || "";
    if (declaredType && !allowedTypes.has(declaredType)) return NextResponse.json({ ok: false, message: "صيغة الملف غير مدعومة." }, { status: 400 });
    buffer = Buffer.from(await response.arrayBuffer());
    sourceSize = buffer.byteLength;
    if (sourceSize > maxBytes) return NextResponse.json({ ok: false, message: "حجم الصورة أكبر من الحد المسموح." }, { status: 400 });
    filename = path.basename(url.pathname) || `remote-image-${Date.now()}`;
  } else {
    return NextResponse.json({ ok: false, message: "اختر ملف صورة." }, { status: 400 });
  }

  let metadata;
  try {
    metadata = await sharp(buffer, { failOn: "truncated" }).rotate().metadata();
  } catch {
    return NextResponse.json({ ok: false, message: "الملف ليس صورة صالحة." }, { status: 400 });
  }
  if (!metadata.width || !metadata.height || metadata.width > 10000 || metadata.height > 10000) {
    return NextResponse.json({ ok: false, message: "أبعاد الصورة غير مدعومة." }, { status: 400 });
  }
  const actualMimeType = metadata.format ? mimeByFormat[metadata.format] : declaredType;
  if (!actualMimeType || !allowedTypes.has(actualMimeType)) {
    return NextResponse.json({ ok: false, message: "صيغة الملف غير مدعومة." }, { status: 400 });
  }

  const extension = path.extname(filename).toLowerCase() || `.${metadata.format || "bin"}`;
  const safeName = `${Date.now()}-${randomUUID()}${extension}`;
  const storagePath = `masters/${safeName}`;
  const assetId = randomUUID();
  try {
    await supabaseStorageUpload(storagePath, new Uint8Array(buffer), actualMimeType);
  } catch (error) {
    return NextResponse.json({ ok: false, message: `تعذر حفظ الصورة: ${error instanceof Error ? error.message : "خطأ غير معروف"}` }, { status: 500 });
  }

  try {
    const asset = await saveMediaAsset({
      filename,
      url: `/api/media/${assetId}`,
      mimeType: actualMimeType,
      sizeBytes: sourceSize,
      width: metadata.width,
      height: metadata.height,
      storagePath,
      isProtected: true,
      watermarkEnabled: formData.get("watermarkEnabled") === "true",
      watermarkText: String(formData.get("watermarkText") || "AbdulAziz Alsari | abdulazizalsari.net"),
      publicFormats: ["webp", "avif"],
      altAr: String(formData.get("altAr") || filename),
      altEn: String(formData.get("altEn") || filename),
      id: assetId
    });
    return NextResponse.json({ ok: true, asset });
  } catch (error) {
    await supabaseStorageDelete(storagePath);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "تعذر حفظ بيانات الصورة." }, { status: 500 });
  }
}

