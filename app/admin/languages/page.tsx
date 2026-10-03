import { redirect } from "next/navigation";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { listLanguages } from "@/lib/cms/translations";
import { AdminFrame } from "../AdminFrame";
import { AdminPageHeader } from "../AdminPageHeader";
import { LanguagesClient } from "./LanguagesClient";

export default async function Page(){
  const user=await getCurrentCmsUser();
  if(!user)redirect("/admin/login");
  if(user.role!=="admin")redirect("/admin/translations");
  const languages=await listLanguages();
  return <AdminFrame role={user.role} email={user.email} displayName={user.displayName}>
    <AdminPageHeader
      title="إدارة اللغات"
      description="أضف لغات الموقع أو عطّلها أو احذفها. العربية هي اللغة الأم ولا يمكن حذفها أو إيقافها."
    />
    <LanguagesClient initialLanguages={languages}/>
  </AdminFrame>;
}
