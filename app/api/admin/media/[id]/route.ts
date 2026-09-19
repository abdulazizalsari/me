import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { deleteMediaAsset, getMediaAssetById, updateMediaAsset } from "@/lib/cms/database";
import { supabaseStorageDelete } from "@/lib/supabase-rest";


export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, message: "بيانات غير صالحة." }, { status: 400 });
  const asset = await updateMediaAsset(id, {
    altAr: typeof body.altAr === "string" ? body.altAr.trim() : undefined,
    altEn: typeof body.altEn === "string" ? body.altEn.trim() : undefined,
    watermarkText: typeof body.watermarkText === "string" ? body.watermarkText.trim() : undefined,
    isProtected: typeof body.isProtected === "boolean" ? body.isProtected : undefined,
    watermarkEnabled: typeof body.watermarkEnabled === "boolean" ? body.watermarkEnabled : undefined
  });
  return asset ? NextResponse.json({ ok: true, asset }) : NextResponse.json({ ok: false, message: "الصورة غير موجودة." }, { status: 404 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const { id } = await context.params;
  const asset = await getMediaAssetById(id);
  if (!asset) return NextResponse.json({ ok: false, message: "الصورة غير موجودة." }, { status: 404 });
  if (asset.storagePath) {
    try {
      await supabaseStorageDelete(asset.storagePath);
    } catch {
      return NextResponse.json({ ok: false, message: "تعذر حذف ملف الصورة من التخزين." }, { status: 500 });
    }
  }
  await deleteMediaAsset(id);
  return NextResponse.json({ ok: true });
}
