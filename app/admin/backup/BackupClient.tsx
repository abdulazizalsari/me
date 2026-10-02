"use client";
import Link from "next/link";
import { useState } from "react";

export function BackupClient(){
  const [message,setMessage]=useState("");
  const [file,setFile]=useState<File|null>(null);

  async function restore(){
    if(!file)return;
    if(!confirm("سيتم استبدال بيانات المحتوى الحالية ببيانات النسخة. هل أنت متأكد؟"))return;
    try{
      const json=JSON.parse((await file.text()).replace(/^\ufeff/,""));
      const r=await fetch("/api/admin/backup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(json)});
      const d=await r.json().catch(()=>({}));
      setMessage(r.ok?"تمت استعادة النسخة بنجاح.":(d.message||"تعذرت الاستعادة."));
    }catch{
      setMessage("الملف ليس JSON صالحًا.");
    }
  }

  return <div className="admin-grid backup-grid">
    <article className="admin-card">
      <h2>تحميل نسخة احتياطية</h2>
      <p className="admin-muted">ملف JSON يحتوي بيانات CMS والترجمات وصفحات Puck والطلبات وإعدادات المستخدمين. ملفات الصور الثنائية تبقى محفوظة في Supabase Storage.</p>
      <Link className="admin-primary-button inline" href="/api/admin/backup">تحميل النسخة الآن</Link>
    </article>
    <article className="admin-card">
      <h2>استعادة نسخة</h2>
      <p className="admin-muted">اختر نسخة سابقة. خذ نسخة من الوضع الحالي أولًا قبل الاستعادة.</p>
      <input type="file" accept=".json,application/json" onChange={e=>setFile(e.target.files?.[0]||null)}/>
      <button className="admin-danger-button" disabled={!file} onClick={restore}>استعادة بعد التأكيد</button>
      {message&&<p className="admin-message">{message}</p>}
    </article>
  </div>;
}
