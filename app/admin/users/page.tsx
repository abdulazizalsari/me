import { redirect } from "next/navigation";import { getCurrentAdmin } from "@/lib/cms/auth";
export default async function Page(){const user=await getCurrentAdmin();if(!user)redirect("/admin/login");redirect("/admin");}
