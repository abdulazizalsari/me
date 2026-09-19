import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { listRevisions, saveContentItem } from "@/lib/cms/database";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const { id } = await context.params;
  return NextResponse.json({ ok: true, revisions: await listRevisions(id) });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { revisionId?: string } | null;
  const revision = (await listRevisions(id)).find((entry) => entry.id === body?.revisionId);
  if (!revision) return NextResponse.json({ ok: false, message: "النسخة غير موجودة." }, { status: 404 });
  const item = await saveContentItem({ ...revision.snapshot, id });
  return NextResponse.json({ ok: true, item });
}
