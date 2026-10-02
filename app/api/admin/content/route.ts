import { NextResponse } from "next/server";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { saveContentItem } from "@/lib/cms/database";
import type { CmsContentSeed, CmsContentType, CmsStatus } from "@/lib/cms/types";

const cmsStatuses: CmsStatus[] = ["draft", "published", "scheduled", "archived"];
const editorTypes: CmsContentType[] = ["article", "course", "service"];

export async function POST(request: Request) {
  const user = await getCurrentCmsUser();
  if (!user) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const body = await request.json().catch(() => null) as (Partial<CmsContentSeed> & { id?: string; metaText?: string }) | null;
  if (!body) return NextResponse.json({ ok: false, message: "بيانات غير صالحة." }, { status: 400 });
  const type = (body.type ?? "service") as CmsContentType;
  if (user.role === "editor" && !editorTypes.includes(type)) {
    return NextResponse.json({ ok: false, message: "المحرر يستطيع تعديل المقالات والدورات والخدمات فقط." }, { status: 403 });
  }
  let meta: Record<string, unknown> = {};
  if (body.metaText?.trim()) {
    try { meta = JSON.parse(body.metaText) as Record<string, unknown>; }
    catch { return NextResponse.json({ ok: false, message: "صيغة JSON في البيانات الإضافية غير صحيحة." }, { status: 400 }); }
  } else if (body.meta && typeof body.meta === "object") meta = body.meta;
  try {
    const item = await saveContentItem({
      id: body.id, type, slug: body.slug ?? "", titleAr: body.titleAr ?? "", titleEn: body.titleEn ?? "",
      summaryAr: body.summaryAr ?? "", summaryEn: body.summaryEn ?? "", bodyAr: body.bodyAr ?? "", bodyEn: body.bodyEn ?? "",
      category: body.category ?? "", status: cmsStatuses.includes(body.status as CmsStatus) ? body.status as CmsStatus : "draft",
      sortOrder: Number(body.sortOrder ?? 0), meta
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "تعذر حفظ المحتوى." }, { status: 400 });
  }
}
