import { redirect } from "next/navigation";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { listContentByType } from "@/lib/cms/database";
import { AdminFrame } from "../AdminFrame";
import { AdminPageHeader } from "../AdminPageHeader";
import { HomepageAdminClient } from "./HomepageAdminClient";

export default async function Page(){
  const user=await getCurrentCmsUser();
  if(!user) redirect("/admin/login");
  const homepages=await listContentByType("homepage");
  return <AdminFrame role={user.role} email={user.email} displayName={user.displayName}>
    <AdminPageHeader title="الصفحة الرئيسية" description="إدارة كل قسم من الصفحة الرئيسية بشكل مستقل، بدون فتح الكود."/>
    <HomepageAdminClient homepage={homepages[0]??null} role={user.role}/>
  </AdminFrame>;
}
