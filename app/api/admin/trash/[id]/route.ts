import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { restoreContentItem } from "@/lib/cms/database";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const { id } = await context.params;
  const item = await restoreContentItem(id);
  return item ? NextResponse.json({ ok: true, item }) : NextResponse.json({ ok: false, message: "العنصر غير موجود." }, { status: 404 });
}
