import { NextResponse } from "next/server";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { createPuckPage, listPuckPages } from "@/lib/cms/puck";

export async function GET() {
  if (!await getCurrentCmsUser()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  return NextResponse.json({ ok: true, pages: await listPuckPages() });
}

export async function POST(request: Request) {
  const user = await getCurrentCmsUser();
  if (!user) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const body = await request.json().catch(() => null) as { slug?: string; titleAr?: string; titleEn?: string } | null;
  if (!body?.slug || !body.titleAr) return NextResponse.json({ ok: false, message: "العنوان والرابط مطلوبان." }, { status: 400 });
  try {
    const page = await createPuckPage({ slug: body.slug, titleAr: body.titleAr, titleEn: body.titleEn, userId: user.id });
    return NextResponse.json({ ok: true, page });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "تعذر إنشاء الصفحة." }, { status: 400 });
  }
}
