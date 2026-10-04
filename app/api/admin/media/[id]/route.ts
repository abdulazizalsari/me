import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { deleteMediaAsset, getMediaAssetById, updateMediaAsset } from "@/lib/cms/database";
import { supabaseRequest, supabaseStorageDelete } from "@/lib/supabase-rest";


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
  const [contentRows, puckRows] = await Promise.all([
    supabaseRequest<Array<Record<string, unknown>>>("/rest/v1/content_items?select=id,type,title_ar,title_en,meta_json,body_ar,body_en&deleted_at=is.null"),
    supabaseRequest<Array<Record<string, unknown>>>("/rest/v1/puck_pages?select=id,slug,title_ar,title_en,data_json,locale_data")
  ]);
  const needles = [id, asset.url, `/api/media/${id}`].filter(Boolean);
  const usage = [
    ...contentRows.flatMap((row) => {
      const haystack = JSON.stringify({ meta: row.meta_json, bodyAr: row.body_ar, bodyEn: row.body_en });
      return needles.some((needle) => haystack.includes(needle))
        ? [{ kind: "content", id: String(row.id), type: String(row.type ?? ""), title: String(row.title_ar || row.title_en || row.id) }]
        : [];
    }),
    ...puckRows.flatMap((row) => {
      const haystack = JSON.stringify({ data: row.data_json, locale: row.locale_data });
      return needles.some((needle) => haystack.includes(needle))
        ? [{ kind: "page", id: String(row.id), type: "puck-page", title: String(row.title_ar || row.title_en || row.slug || row.id) }]
        : [];
    })
  ];

  if (usage.length) {
    return NextResponse.json({
      ok: false,
      code: "MEDIA_IN_USE",
      message: "لا يمكن حذف الصورة لأنها مستخدمة حاليًا في الموقع.",
      usage
    }, { status: 409 });
  }

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
