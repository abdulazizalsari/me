import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { deleteRedirect } from "@/lib/cms/database";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const { id } = await context.params;
  return NextResponse.json({ ok: await deleteRedirect(id) });
}
