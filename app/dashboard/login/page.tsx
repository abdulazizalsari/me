import type { Metadata } from "next";
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

  return <LoginForm />;
}
