import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "دخول لوحة التحكم",
  description: "تسجيل الدخول إلى لوحة إدارة محتوى موقع عبدالعزيز الصاري"
};

export default async function DashboardLoginPage() {
  const user = await getCurrentAdmin();
  if (user) redirect("/dashboard");
  return <><LoginForm /><p style={{textAlign:"center",marginTop:12}}><Link href="/dashboard/setup">إعداد المدير لأول مرة</Link></p></>;
}

