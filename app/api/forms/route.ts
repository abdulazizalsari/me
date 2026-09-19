import { NextResponse } from "next/server";
import { createFormSubmission } from "@/lib/cms/database";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, message: "Invalid form data." }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const message = String(body.message ?? "").trim();
  if (name.length < 2 || !email.includes("@") || phone.length < 5 || message.length < 10) {
    return NextResponse.json({ ok: false, message: "Please complete the required fields." }, { status: 400 });
  }

  const submission = await createFormSubmission({
    name,
    email,
    phone,
    message,
    source: String(body.source ?? "contact"),
    payload: body
  });

  return NextResponse.json({ ok: true, submissionId: submission.id });
}
