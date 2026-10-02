"use client";

import { useMemo, useState } from "react";
import type { CmsContentItem, CmsContentType, CmsRole, CmsStatus } from "@/lib/cms/types";

const allowedTypes: CmsContentType[]=["article","course","service"];
const labels:Record<string,string>={article:"مقال",course:"دورة",service:"خدمة"};
const empty=(type:CmsContentType):CmsContentItem=>({id:"",type,slug:"",titleAr:"",titleEn:"",summaryAr:"",summaryEn:"",bodyAr:"",bodyEn:"",category:"",status:"draft",sortOrder:100,meta:{},createdAt:"",updatedAt:""});

export function AdminContentClient({initialItems,role}:{initialItems:CmsContentItem[];role:CmsRole}){
 const [items,setItems]=useState(initialItems.filter(i=>allowedTypes.includes(i.type)));
 const [type,setType]=useState<CmsContentType>("article");
 const [query,setQuery]=useState("");
 const [editing,setEditing]=useState<CmsContentItem>(empty("article"));
 const [lang,setLang]=useState<"ar"|"en">("ar");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");

 const filtered=useMemo(()=>items.filter(i=>i.type===type&&`${i.titleAr} ${i.titleEn} ${i.category} ${i.slug}`.toLowerCase().includes(query.toLowerCase())),[items,type,query]);
 function start(t:CmsContentType=type){setType(t);setEditing(empty(t));setLang("ar");setMessage("");}
 function edit(item:CmsContentItem){setEditing(item);setType(item.type);setLang("ar");setMessage("");}

 async function save(e:React.FormEvent){
  e.preventDefault();setBusy(true);setMessage("");
  const response=await fetch("/api/admin/content",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(editing)});
  const data=await response.json().catch(()=>({}));
  setBusy(false);
  if(!response.ok||!data.item){setMessage(data.message||"تعذر الحفظ.");return;}
  setItems(cur=>[data.item,...cur.filter(i=>i.id!==data.item.id)]);
  setEditing(data.item);setMessage("تم الحفظ بنجاح.");
 }
 async function remove(id:string){
  if(role!=="admin"||!confirm("حذف هذا العنصر؟ يمكن استرجاعه من لوحة النظام القديمة مؤقتًا."))return;
  const r=await fetch(`/api/admin/content/${id}`,{method:"DELETE"});
  if(!r.ok){setMessage("تعذر الحذف.");return;}
  setItems(cur=>cur.filter(i=>i.id!==id));if(editing.id===id)setEditing(empty(type));
 }
 return <div className="admin-content-layout">
  <section className="admin-card admin-list-panel">
   <div className="admin-segmented">{allowedTypes.map(t=><button key={t} className={type===t?"active":""} onClick={()=>{setType(t);setEditing(empty(t));}}>{labels[t]}</button>)}</div>
   <div className="admin-list-tools"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث..."/><button className="admin-primary-button" onClick={()=>start()}>+ إضافة {labels[type]}</button></div>
   <div className="admin-table-wrap"><table><thead><tr><th>العنوان</th><th>الحالة</th><th>التصنيف</th><th>إجراءات</th></tr></thead><tbody>
   {filtered.map(item=><tr key={item.id}><td><strong>{item.titleAr||item.titleEn}</strong><small>{item.slug}</small></td><td><span className={`admin-status ${item.status}`}>{item.status==="published"?"منشور":item.status==="draft"?"مسودة":item.status}</span></td><td>{item.category}</td><td><button onClick={()=>edit(item)}>تعديل</button>{role==="admin"&&<button className="danger" onClick={()=>remove(item.id)}>حذف</button>}</td></tr>)}
   {!filtered.length&&<tr><td colSpan={4} className="admin-empty">لا توجد عناصر.</td></tr>}
   </tbody></table></div>
  </section>
  <section className="admin-card admin-editor-panel">
   <h2>{editing.id?"تحرير":"إضافة"} {labels[editing.type]}</h2>
   <div className="admin-language-tabs"><button className={lang==="ar"?"active":""} onClick={()=>setLang("ar")}>العربية · اللغة الأم</button><button className={lang==="en"?"active":""} onClick={()=>setLang("en")}>English</button></div>
   <form className="admin-form" onSubmit={save}>
    <div className="admin-form-row"><label>النوع<select value={editing.type} onChange={e=>setEditing({...editing,type:e.target.value as CmsContentType})}>{allowedTypes.map(t=><option key={t} value={t}>{labels[t]}</option>)}</select></label><label>الحالة<select value={editing.status} onChange={e=>setEditing({...editing,status:e.target.value as CmsStatus})}><option value="draft">مسودة</option><option value="published">منشور</option><option value="scheduled">مجدول</option><option value="archived">مؤرشف</option></select></label></div>
    <label>الرابط المختصر<input dir="ltr" value={editing.slug} onChange={e=>setEditing({...editing,slug:e.target.value})} required/></label>
    <label>التصنيف<input value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value})}/></label>
    {lang==="ar"?<>
      <label>العنوان بالعربية<input value={editing.titleAr} onChange={e=>setEditing({...editing,titleAr:e.target.value})} required/></label>
      <label>الملخص<textarea rows={3} value={editing.summaryAr} onChange={e=>setEditing({...editing,summaryAr:e.target.value})}/></label>
      <label>المحتوى<textarea rows={12} value={editing.bodyAr||""} onChange={e=>setEditing({...editing,bodyAr:e.target.value})}/></label>
    </>:<>
      <label dir="ltr">English title<input value={editing.titleEn} onChange={e=>setEditing({...editing,titleEn:e.target.value})}/></label>
      <label dir="ltr">English summary<textarea rows={3} value={editing.summaryEn} onChange={e=>setEditing({...editing,summaryEn:e.target.value})}/></label>
      <label dir="ltr">English content<textarea rows={12} value={editing.bodyEn||""} onChange={e=>setEditing({...editing,bodyEn:e.target.value})}/></label>
    </>}
    <label>الترتيب<input type="number" value={editing.sortOrder} onChange={e=>setEditing({...editing,sortOrder:Number(e.target.value)})}/></label>
    {message&&<p className="admin-message">{message}</p>}
    <button className="admin-primary-button" disabled={busy}>{busy?"جار الحفظ...":"حفظ"}</button>
   </form>
  </section>
 </div>;
}
