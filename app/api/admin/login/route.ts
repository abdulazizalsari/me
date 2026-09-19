import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/cms/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = body?.email?.trim() ?? "";
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ ok: false, message: "البريد الإلكتروني وكلمة المرور مطلوبان." }, { status: 400 });
  }

  const user = await loginAdmin(email, password);
  if (!user) {
    return NextResponse.json({ ok: false, message: "بيانات الدخول غير صحيحة." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}
