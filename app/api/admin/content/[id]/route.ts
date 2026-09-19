import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { deleteContentItem } from "@/lib/cms/database";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });

  const { id } = await context.params;
  const deleted = await deleteContentItem(id);
  return NextResponse.json({ ok: deleted });
}
