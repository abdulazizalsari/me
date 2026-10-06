import { redirect } from "next/navigation";
import { getCurrentCmsUser } from "@/lib/cms/auth";
export default async function AdminPage(){const user=await getCurrentCmsUser();if(!user)redirect("/dashboard/login");redirect("/dashboard");}
