import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata: Metadata = { title: "دخول لوحة التحكم" };

export default async function AdminLoginPage() {
  const user = await getCurrentCmsUser();
  if (user) redirect("/admin");
  return <AdminLoginForm />;
}
