"use client";

import { useState } from "react";
import type { CmsPuckPage, CmsRole } from "@/lib/cms/types";

export function AdminPagesClient({initialPages,role}:{initialPages:CmsPuckPage[];role:CmsRole}){
 const [pages,setPages]=useState(initialPages);const [titleAr,setTitleAr]=useState("");const [titleEn,setTitleEn]=useState("");const [slug,setSlug]=useState("");const [message,setMessage]=useState("");
 async function create(e:React.FormEvent){e.preventDefault();const r=await fetch("/api/admin/pages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({titleAr,titleEn,slug})});const d=await r.json().catch(()=>({}));if(!r.ok||!d.page){setMessage(d.message||"تعذر الإنشاء.");return;}setPages(p=>[d.page,...p]);setTitleAr("");setTitleEn("");setSlug("");setMessage("تم إنشاء الصفحة.");}
 async function setStatus(page:CmsPuckPage,status:CmsPuckPage["status"]){const r=await fetch(`/api/admin/pages/${page.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});const d=await r.json().catch(()=>({}));if(r.ok&&d.page)setPages(p=>p.map(x=>x.id===page.id?d.page:x));else setMessage(d.message||"تعذر تحديث الحالة.");}
 async function remove(page:CmsPuckPage){if(role!=="admin"||!confirm(`حذف «${page.titleAr}» نهائيًا؟`))return;const r=await fetch(`/api/admin/pages/${page.id}`,{method:"DELETE"});if(r.ok)setPages(p=>p.filter(x=>x.id!==page.id));}
 return <div className="admin-stack">
  <form className="admin-card admin-inline-create" onSubmit={create}><h2>صفحة جديدة</h2><div className="admin-form-row three"><label>العنوان العربي<input value={titleAr} onChange={e=>setTitleAr(e.target.value)} required/></label><label>English title<input dir="ltr" value={titleEn} onChange={e=>setTitleEn(e.target.value)}/></label><label>الرابط<input dir="ltr" value={slug} onChange={e=>setSlug(e.target.value)} placeholder="landing-page" required/></label></div><button className="admin-primary-button">إنشاء وفتح المحرر لاحقًا</button>{message&&<p className="admin-message">{message}</p>}</form>
  <section className="admin-card"><div className="admin-table-wrap"><table><thead><tr><th>الصفحة</th><th>الرابط</th><th>الحالة</th><th>آخر تحديث</th><th>إجراءات</th></tr></thead><tbody>
  {pages.map(page=><tr key={page.id}><td><strong>{page.titleAr}</strong><small>{page.titleEn}</small></td><td dir="ltr">/{page.slug}</td><td><select value={page.status} onChange={e=>setStatus(page,e.target.value as CmsPuckPage["status"])}><option value="draft">مسودة</option><option value="published">منشور</option><option value="archived">مؤرشف</option></select></td><td>{new Date(page.updatedAt).toLocaleString("ar")}</td><td><a className="admin-table-link" href={`/admin/pages/${page.id}/edit`}>فتح Puck</a>{page.status==="published"&&<a className="admin-table-link" href={`/${page.slug}`} target="_blank">معاينة</a>}{role==="admin"&&<button className="danger" onClick={()=>remove(page)}>حذف</button>}</td></tr>)}
  {!pages.length&&<tr><td colSpan={5} className="admin-empty">لا توجد صفحات بعد.</td></tr>}
  </tbody></table></div></section>
 </div>;
}
