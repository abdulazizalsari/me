import { NextResponse } from "next/server";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { savePuckPage } from "@/lib/cms/puck";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentCmsUser();
  if (!user) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as { data?: Record<string, unknown> } | null;
  if (!body?.data || !Array.isArray((body.data as { content?: unknown }).content)) {
    return NextResponse.json({ ok: false, message: "بيانات الصفحة غير صالحة." }, { status: 400 });
  }
  const page = await savePuckPage(id, { data: body.data, userId: user.id });
  if (!page) return NextResponse.json({ ok: false, message: "الصفحة غير موجودة." }, { status: 404 });
  return NextResponse.json({ ok: true, page });
}
