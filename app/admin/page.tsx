import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { listContentItems, listFormSubmissions } from "@/lib/cms/database";
import { listPuckPages } from "@/lib/cms/puck";

export default async function AdminPage() {
  const user = await getCurrentCmsUser();
  if (!user) redirect("/admin/login");
  const [items, requests, pages] = await Promise.all([listContentItems(), listFormSubmissions(), listPuckPages()]);
  const articles = items.filter((item) => item.type === "article").length;
  const courses = items.filter((item) => item.type === "course").length;
  const services = items.filter((item) => item.type === "service").length;
  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div><h1>لوحة التحكم</h1><p className="admin-muted">{user.displayName || user.email} · {user.role === "admin" ? "مدير" : "محرر"}</p></div>
        <div className="admin-actions">
          <Link className="admin-link" href="/">عرض الموقع</Link>
          <Link className="admin-link primary" href="/admin/pages">محرر الصفحات</Link>
        </div>
      </header>
      <section className="admin-grid">
        <article className="admin-card admin-stat"><strong>{articles}</strong><span>مقال</span></article>
        <article className="admin-card admin-stat"><strong>{courses}</strong><span>دورة</span></article>
        <article className="admin-card admin-stat"><strong>{services}</strong><span>خدمة</span></article>
        <article className="admin-card admin-stat"><strong>{requests.filter((r) => r.status === "new").length}</strong><span>طلب جديد</span></article>
        <article className="admin-card admin-stat"><strong>{pages.length}</strong><span>صفحة Puck</span></article>
      </section>
      <section className="admin-card" style={{ marginTop: 16 }}>
        <h2>إدارة الموقع</h2>
        <div className="admin-actions">
          <Link className="admin-link" href="/admin/content">المحتوى</Link>
          <Link className="admin-link" href="/admin/translations">الترجمة</Link>
          <Link className="admin-link" href="/admin/requests">الطلبات</Link>
          {user.role === "admin" && <Link className="admin-link" href="/admin/users">المستخدمون</Link>}
          {user.role === "admin" && <Link className="admin-link" href="/admin/backup">النسخ الاحتياطي</Link>}
        </div>
      </section>
    </main>
  );
}
