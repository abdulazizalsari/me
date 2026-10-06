import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { listContentByType, listContentItems, listFormSubmissions } from "@/lib/cms/database";
import { listPuckPages } from "@/lib/cms/puck";
import { AdminFrame } from "./AdminFrame";
import { AdminPageHeader } from "./AdminPageHeader";
import { RelatedProjectsAdminClient } from "./related-projects/RelatedProjectsAdminClient";

export default async function AdminPage() {
  const user=await getCurrentCmsUser();
  if(!user) redirect("/admin/login");

  const [items,requests,pages,projects,homepages]=await Promise.all([
    listContentItems(),
    listFormSubmissions(),
    listPuckPages(),
    listContentByType("project"),
    listContentByType("homepage")
  ]);
  const articles=items.filter(i=>i.type==="article").length;
  const courses=items.filter(i=>i.type==="course").length;
  const services=items.filter(i=>i.type==="service").length;

  return <AdminFrame role={user.role} email={user.email} displayName={user.displayName}>
    <AdminPageHeader title="نظرة عامة" description="ملخص سريع للمحتوى والطلبات والصفحات وإدارة المشاريع ذات الصلة."/>
    <section className="admin-grid">
      <article className="admin-card admin-stat"><strong>{articles}</strong><span>مقال</span></article>
      <article className="admin-card admin-stat"><strong>{courses}</strong><span>دورة</span></article>
      <article className="admin-card admin-stat"><strong>{services}</strong><span>خدمة</span></article>
      <article className="admin-card admin-stat"><strong>{requests.filter(r=>r.status==="new").length}</strong><span>طلب جديد</span></article>
      <article className="admin-card admin-stat"><strong>{pages.length}</strong><span>صفحة Puck</span></article>
    </section>

    <section className="admin-card admin-dashboard-shortcuts">
      <h2>إجراءات سريعة</h2>
      <div className="admin-actions">
        <Link className="admin-link primary" href="/admin/homepage">تعديل الصفحة الرئيسية</Link>
        <Link className="admin-link" href="/admin/content">إدارة المحتوى</Link>
        <Link className="admin-link" href="/admin/pages">إدارة الصفحات</Link>
        <Link className="admin-link" href="/admin/translations">إدارة الترجمة</Link>
        <Link className="admin-link" href="/admin/requests">متابعة الطلبات</Link>
      </div>
    </section>

    <section className="admin-dashboard-related-projects">
      <AdminPageHeader title="المشاريع ذات الصلة" description="إدارة كاملة للقسم من اللوحة الرئيسية: الظهور، العناوين، السلايدر، المشاريع، الصور، الروابط، الحماية، العلامة المائية والترتيب."/>
      <RelatedProjectsAdminClient projects={projects} homepage={homepages[0] ?? null} role={user.role} />
    </section>
  </AdminFrame>;
}
