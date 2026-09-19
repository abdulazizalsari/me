import { NextResponse } from "next/server";
import sharp from "sharp";
import { getMediaAssetById } from "@/lib/cms/database";
import { supabaseStorageDownload } from "@/lib/supabase-rest";

export const runtime = "nodejs";

function watermarkSvg(text: string, width: number, height: number) {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fontSize = Math.max(13, Math.round(width / 72));
  const patternWidth = Math.max(260, Math.round(width / 2.7));
  const patternHeight = Math.max(140, Math.round(patternWidth * 0.46));
  const cx = Math.round(patternWidth / 2);
  const cy = Math.round(patternHeight / 2);
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="wm" width="${patternWidth}" height="${patternHeight}" patternUnits="userSpaceOnUse"><g transform="rotate(-24 ${cx} ${cy})"><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="${fontSize}px" font-weight="700" letter-spacing="0.5px" fill="white" fill-opacity="0.28" stroke="black" stroke-opacity="0.10" stroke-width="1">${escaped}</text></g></pattern></defs><rect width="100%" height="100%" fill="url(#wm)"/></svg>`);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const asset = await getMediaAssetById(id);
  if (!asset?.storagePath) return NextResponse.json({ ok: false, message: "الصورة غير متاحة." }, { status: 404 });

  const referer = request.headers.get("referer");
  if (referer && asset.isProtected) {
    try {
      const allowedHost = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://abdulazizalsari.net").hostname;
      const refererHost = new URL(referer).hostname;
      const localHost = refererHost === "localhost" || refererHost === "127.0.0.1";
      if (!localHost && refererHost !== allowedHost && refererHost !== `www.${allowedHost}` && `www.${refererHost}` !== allowedHost) {
        return NextResponse.json({ ok: false, message: "مصدر غير مسموح." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ ok: false, message: "مصدر غير صالح." }, { status: 403 });
    }
  }

  try {
    const bytes = await supabaseStorageDownload(asset.storagePath);
    const source = sharp(bytes, { failOn: "truncated" }).rotate();
    const metadata = await source.metadata();
    const width = Math.min(metadata.width ?? 1600, 1600);
    let image = source.resize({ width, withoutEnlargement: true });
    if (asset.isProtected || asset.watermarkEnabled) {
      const height = Math.max(1, Math.round((metadata.height ?? width) * width / (metadata.width ?? width)));
      const watermarkText = asset.watermarkText?.trim() || "AbdulAziz Alsari | abdulazizalsari.net";
      image = image.composite([{ input: watermarkSvg(watermarkText, width, height), gravity: "center" }]);
    }

    const format = new URL(request.url).searchParams.get("format") === "avif" ? "avif" : "webp";
    const output = format === "avif" ? await image.avif({ quality: 68 }).toBuffer() : await image.webp({ quality: 78 }).toBuffer();
    return new NextResponse(new Uint8Array(output), {
      headers: {
        "Content-Type": format === "avif" ? "image/avif" : "image/webp",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-site"
      }
    });
  } catch {
    return NextResponse.json({ ok: false, message: "تعذر تجهيز الصورة." }, { status: 404 });
  }
}
