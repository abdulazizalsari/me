import { NextResponse } from "next/server";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { saveContentItem } from "@/lib/cms/database";
import { syncContentEnglishTranslations } from "@/lib/cms/translations";
import type { CmsContentSeed, CmsContentType, CmsStatus } from "@/lib/cms/types";
import { sanitizeCmsHtml } from "@/lib/cms/sanitize";

const cmsStatuses: CmsStatus[] = ["draft", "published", "scheduled", "archived"];
const editorTypes: CmsContentType[] = ["article", "course", "service", "homepage"];

export async function POST(request: Request) {
  const user = await getCurrentCmsUser();
  if (!user) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const body = await request.json().catch(() => null) as (Partial<CmsContentSeed> & { id?: string; metaText?: string }) | null;
  if (!body) return NextResponse.json({ ok: false, message: "بيانات غير صالحة." }, { status: 400 });
  const type = (body.type ?? "service") as CmsContentType;
  if (user.role === "assistant" && !["article", "service", "course"].includes(type)) {
    return NextResponse.json({ ok: false, message: "المساعد يعمل فقط ضمن المحتوى المصرح له." }, { status: 403 });
  }
  if (user.role === "editor" && !editorTypes.includes(type)) {
    return NextResponse.json({ ok: false, message: "المحرر يستطيع تعديل المقالات والدورات والخدمات فقط." }, { status: 403 });
  }
  if (user.role === "assistant" && type !== "article" && !user.permissions.includes("pages_manage")) {
    return NextResponse.json({ ok: false, message: "لا تملك صلاحية تعديل هذا القسم." }, { status: 403 });
  }
  if (user.role === "writer" && type !== "article") {
    return NextResponse.json({ ok: false, message: "كاتب المقالات يستطيع العمل على المقالات فقط." }, { status: 403 });
  }
  if (user.role !== "admin" && type === "article" && !user.permissions.some((p) => ["articles_create", "articles_edit", "articles_publish"].includes(p))) {
    return NextResponse.json({ ok: false, message: "لا تملك صلاحية تعديل المقالات." }, { status: 403 });
  }
  if (user.role === "reviewer" && type !== "article") {
    return NextResponse.json({ ok: false, message: "المراجع والناشر يعمل على المقالات فقط." }, { status: 403 });
  }
  if (user.role === "reviewer" && type === "article" && !user.permissions.some((p) => ["articles_edit", "articles_publish"].includes(p))) {
    return NextResponse.json({ ok: false, message: "لا تملك صلاحية مراجعة المقالات." }, { status: 403 });
  }
  if (user.role === "writer" && body.status && body.status !== "draft") {
    return NextResponse.json({ ok: false, message: "كاتب المقالات يحفظ كمسودة ويرسلها للمراجعة فقط." }, { status: 403 });
  }
  if (user.role === "reviewer" && body.status === "published" && !user.permissions.includes("articles_publish")) {
    return NextResponse.json({ ok: false, message: "لا تملك صلاحية نشر المقالات." }, { status: 403 });
  }

  let meta: Record<string, unknown> = {};
  if (body.metaText?.trim()) {
    try { meta = JSON.parse(body.metaText) as Record<string, unknown>; }
    catch { return NextResponse.json({ ok: false, message: "صيغة JSON في البيانات الإضافية غير صحيحة." }, { status: 400 }); }
  } else if (body.meta && typeof body.meta === "object") meta = body.meta;

  if (type === "article") {
    meta = { ...meta, authorId: String(meta.authorId || user.id), authorName: String(meta.authorName || user.displayName || user.email) };
  }

  try {
    const item = await saveContentItem({
      id: body.id, type, slug: body.slug ?? "", titleAr: body.titleAr ?? "", titleEn: body.titleEn ?? "",
      summaryAr: body.summaryAr ?? "", summaryEn: body.summaryEn ?? "", bodyAr: sanitizeCmsHtml(body.bodyAr ?? ""), bodyEn: sanitizeCmsHtml(body.bodyEn ?? ""),
      category: body.category ?? "", status: cmsStatuses.includes(body.status as CmsStatus) ? body.status as CmsStatus : "draft",
      sortOrder: Number(body.sortOrder ?? 0), meta
    });
    await syncContentEnglishTranslations(item, user.id).catch(() => undefined);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "تعذر حفظ المحتوى." }, { status: 400 });
  }
}
