import { redirect } from "next/navigation";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { listContentByType } from "@/lib/cms/database";
import { AdminFrame } from "../AdminFrame";
import { AdminPageHeader } from "../AdminPageHeader";
import { RelatedProjectsAdminClient } from "./RelatedProjectsAdminClient";

export default async function Page() {
  const user = await getCurrentCmsUser();
  if (!user) redirect("/admin/login");
  const [projects, homepages] = await Promise.all([
    listContentByType("project"),
    listContentByType("homepage")
  ]);
  const homepage = homepages[0] ?? null;
  return (
    <AdminFrame role={user.role} email={user.email} displayName={user.displayName}>
      <AdminPageHeader
        title="المشاريع ذات الصلة"
        description="تحكم كامل بالقسم الظاهر في الصفحة الرئيسية والسلايدر المرتبط به."
      />
      <RelatedProjectsAdminClient projects={projects} homepage={homepage} role={user.role} />
    </AdminFrame>
  );
}
