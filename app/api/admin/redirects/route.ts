import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { listRedirects, saveRedirect } from "@/lib/cms/database";
import type { CmsRedirect } from "@/lib/cms/types";

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  return NextResponse.json({ ok: true, redirects: await listRedirects() });
}

export async function POST(request: Request) {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const body = await request.json().catch(() => null) as Partial<CmsRedirect> | null;
  if (!body?.oldUrl || !body.statusCode) return NextResponse.json({ ok: false, message: "بيانات التحويل غير مكتملة." }, { status: 400 });
  try {
    const redirect = await saveRedirect({
      id: body.id,
      oldUrl: body.oldUrl,
      newUrl: body.newUrl ?? "",
      statusCode: body.statusCode,
      active: body.active
    });
    return NextResponse.json({ ok: true, redirect });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "تعذر حفظ التحويل." }, { status: 400 });
  }
}
