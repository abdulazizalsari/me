import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { listFormSubmissions } from "@/lib/cms/database";

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  return NextResponse.json({ ok: true, submissions: await listFormSubmissions() });
}
