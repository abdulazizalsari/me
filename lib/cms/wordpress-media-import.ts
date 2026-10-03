import { lookup } from "node:dns/promises";
import net from "node:net";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { saveMediaAsset } from "@/lib/cms/database";
import { supabaseStorageUpload, supabaseStorageDelete } from "@/lib/supabase-rest";
import type { CmsMediaAsset } from "@/lib/cms/types";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);
const mimeByFormat: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif"
};
const maxBytes = 5 * 1024 * 1024;

function isPrivateIp(address: string) {
  if (net.isIP(address) === 6) {
    return address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:");
  }
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || a === 0;
}

async function assertPublicUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("رابط الصورة غير صالح.");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("رابط الصورة يجب أن يكون http أو https.");
  const records = await lookup(url.hostname, { all: true });
  if (!records.length || records.some((record) => isPrivateIp(record.address))) {
    throw new Error("لا يمكن استيراد صورة من عنوان داخلي أو خاص.");
  }
  return url;
}

async function fetchRemoteImage(rawUrl: string) {
  let url = await assertPublicUrl(rawUrl);
  for (let redirectCount = 0; redirectCount < 4; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        redirect: "manual",
        headers: { "User-Agent": "AbdulAzizAlsari-WordPress-Importer/1.0" }
      });
    } finally {
      clearTimeout(timeout);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("تحويل رابط الصورة غير صالح.");
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }

    if (!response.ok) throw new Error(`تعذر تنزيل الصورة (HTTP ${response.status}).`);
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > maxBytes) throw new Error("حجم الصورة أكبر من 5MB.");

    const declaredType = response.headers.get("content-type")?.split(";")[0].trim() || "";
    if (declaredType && !allowedTypes.has(declaredType)) throw new Error("صيغة الصورة غير مدعومة.");

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) throw new Error("حجم الصورة أكبر من 5MB.");
    return { buffer, finalUrl: url, declaredType };
  }
  throw new Error("عدد تحويلات رابط الصورة أكبر من المسموح.");
}

function originalFilename(url: URL, fallbackFormat: string) {
  const raw = path.basename(url.pathname);
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch { /* keep raw */ }
  return decoded || `wordpress-image.${fallbackFormat || "webp"}`;
}

export async function importWordPressRemoteImage(rawUrl: string, alt = ""): Promise<CmsMediaAsset> {
  const { buffer, finalUrl, declaredType } = await fetchRemoteImage(rawUrl);

  let metadata;
  try {
    metadata = await sharp(buffer, { failOn: "truncated" }).rotate().metadata();
  } catch {
    throw new Error("الملف البعيد ليس صورة صالحة.");
  }

  if (!metadata.width || !metadata.height || metadata.width > 10000 || metadata.height > 10000) {
    throw new Error("أبعاد الصورة غير مدعومة.");
  }

  const actualMime = metadata.format ? mimeByFormat[metadata.format] : declaredType;
  if (!actualMime || !allowedTypes.has(actualMime)) throw new Error("صيغة الصورة غير مدعومة.");

  const filename = originalFilename(finalUrl, metadata.format || "webp");
  const extension = path.extname(filename).toLowerCase() || `.${metadata.format || "webp"}`;
  const assetId = randomUUID();
  const storagePath = `wordpress-import/${Date.now()}-${randomUUID()}${extension}`;

  await supabaseStorageUpload(storagePath, new Uint8Array(buffer), actualMime);
  try {
    return await saveMediaAsset({
      id: assetId,
      filename,
      url: `/api/media/${assetId}`,
      mimeType: actualMime,
      sizeBytes: buffer.byteLength,
      width: metadata.width,
      height: metadata.height,
      storagePath,
      isProtected: true,
      watermarkEnabled: false,
      watermarkText: "AbdulAziz Alsari | abdulazizalsari.net",
      publicFormats: ["webp", "avif"],
      altAr: alt || filename,
      altEn: alt || filename
    });
  } catch (error) {
    await supabaseStorageDelete(storagePath);
    throw error;
  }
}
