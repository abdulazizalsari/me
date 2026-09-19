import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { updateFormSubmission } from "@/lib/cms/database";
import type { CmsFormSubmission } from "@/lib/cms/types";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as Partial<CmsFormSubmission> | null;
  const allowed = new Set(["new", "in_progress", "done", "archived"]);
  const submission = await updateFormSubmission(id, {
    status: body?.status && allowed.has(body.status) ? body.status : undefined,
    notes: typeof body?.notes === "string" ? body.notes : undefined
  });
  return submission ? NextResponse.json({ ok: true, submission }) : NextResponse.json({ ok: false, message: "الرسالة غير موجودة." }, { status: 404 });
}
