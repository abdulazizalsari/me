import { NextResponse } from "next/server";
import { signupInitialAdmin } from "@/lib/cms/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = body?.email?.trim() ?? "";
  const password = body?.password ?? "";
  if (!email || password.length < 12) {
    return NextResponse.json({ ok: false, message: "استخدم البريد الإداري وكلمة مرور من 12 حرفاً على الأقل." }, { status: 400 });
  }
  try {
    const result = await signupInitialAdmin(email, password);
    return NextResponse.json({
      ok: true,
      confirmed: result.confirmed,
      message: result.confirmed
        ? "تم إنشاء المدير وتسجيل الدخول."
        : "تم إنشاء الحساب. افتح رسالة التأكيد في البريد ثم سجّل الدخول."
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "تعذر إنشاء المدير." }, { status: 400 });
  }
}
