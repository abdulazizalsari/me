import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = { title: "تهيئة مدير الموقع", robots: { index: false, follow: false } };

export default async function SetupPage() {
  const user = await getCurrentAdmin();
  if (user) redirect("/dashboard");
  return <main className="admin-login-page" dir="rtl"><section className="admin-login-card"><p className="eyebrow">إعداد أول مرة</p><h1>إنشاء مدير الموقع</h1><p className="muted">هذه الصفحة تقبل البريد الإداري المحدد للموقع فقط.</p><SetupForm /></section></main>;
}
