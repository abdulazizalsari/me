"use client";

import { useState } from "react";
import type { CmsLanguage } from "@/lib/cms/types";

const EMPTY = { code:"", nameAr:"", nameNative:"", direction:"ltr" as "rtl"|"ltr", enabled:true };

export function LanguagesClient({initialLanguages}:{initialLanguages:CmsLanguage[]}){
  const [languages,setLanguages]=useState(initialLanguages);
  const [form,setForm]=useState(EMPTY);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState("");

  async function persist(language:CmsLanguage){
    setBusy(language.code);
    setMessage("");
    const r=await fetch("/api/admin/translations",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"language",...language})
    });
    const d=await r.json().catch(()=>({}));
    setBusy("");
    if(!r.ok){setMessage(d.message||"تعذر حفظ إعدادات اللغة.");return false;}
    setLanguages(cur=>[...cur.filter(item=>item.code!==language.code),language].sort((a,b)=>a.sortOrder-b.sortOrder||a.code.localeCompare(b.code)));
    setMessage(`تم حفظ إعدادات اللغة: ${language.nameAr}`);
    return true;
  }

  async function addLanguage(e:React.FormEvent){
    e.preventDefault();
    const code=form.code.trim().toLowerCase();
    if(!/^[a-z]{2,10}(-[a-z0-9]{2,8})?$/.test(code)){
      setMessage("رمز اللغة غير صالح. استخدم رمزًا مثل fr أو tr أو es."); return;
    }
    if(languages.some(item=>item.code===code)){
      setMessage("هذه اللغة موجودة بالفعل."); return;
    }
    const next:CmsLanguage={
      code,
      nameAr:form.nameAr.trim()||code,
      nameNative:form.nameNative.trim()||form.nameAr.trim()||code,
      direction:form.direction,
      enabled:form.enabled,
      sortOrder:languages.length?Math.max(...languages.map(item=>item.sortOrder))+1:1
    };
    if(await persist(next)) setForm(EMPTY);
  }

  async function toggleLanguage(language:CmsLanguage){
    const next={...language,enabled:!language.enabled};
    if(await persist(next)){}
  }

  async function updateDirection(language:CmsLanguage,direction:"rtl"|"ltr"){
    if(language.code==="ar")return;
    await persist({...language,direction});
  }

  async function updateOrder(language:CmsLanguage,sortOrder:number){
    await persist({...language,sortOrder});
  }

  async function removeLanguage(language:CmsLanguage){
    if(language.code==="ar")return;
    if(!confirm(`حذف لغة «${language.nameAr}»؟ سيتم حذف إعداد اللغة وترجماتها المرتبطة بها.`))return;
    setBusy(language.code);
    const r=await fetch(`/api/admin/translations?code=${encodeURIComponent(language.code)}`,{method:"DELETE"});
    const d=await r.json().catch(()=>({}));
    setBusy("");
    if(!r.ok){setMessage(d.message||"تعذر حذف اللغة.");return;}
    setLanguages(cur=>cur.filter(item=>item.code!==language.code));
    setMessage(`تم حذف اللغة: ${language.nameAr}`);
  }

  return <div className="admin-stack">
    <section className="admin-card admin-language-manager">
      <div className="admin-card-heading">
        <div>
          <h2>إدارة لغات الموقع</h2>
          <p className="admin-muted">يمكنك إضافة أي لغة، إظهارها أو إخفاؤها، تغيير اتجاهها وترتيبها، أو حذفها. العربية هي اللغة الأم ولا يمكن حذفها.</p>
        </div>
      </div>
      {message&&<p className="admin-message">{message}</p>}
    </section>

    <section className="admin-card">
      <div className="admin-card-heading">
        <div><h2>إضافة لغة جديدة</h2><p className="admin-muted">أدخل رمز اللغة واسمها. بعد الإضافة ستظهر في أدوات الترجمة ويمكن التحكم في ظهورها بالموقع.</p></div>
      </div>
      <form onSubmit={addLanguage} className="admin-inline-create">
        <input value={form.nameAr} onChange={e=>setForm({...form,nameAr:e.target.value})} placeholder="اسم اللغة بالعربية" required />
        <input value={form.nameNative} onChange={e=>setForm({...form,nameNative:e.target.value})} placeholder="اسم اللغة بلغتها الأصلية" required />
        <input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} placeholder="رمز اللغة: fr / tr / es" required dir="ltr" />
        <select value={form.direction} onChange={e=>setForm({...form,direction:e.target.value==="rtl"?"rtl":"ltr"})}>
          <option value="ltr">LTR</option>
          <option value="rtl">RTL</option>
        </select>
        <label className="admin-checkbox"><input type="checkbox" checked={form.enabled} onChange={e=>setForm({...form,enabled:e.target.checked})}/> إظهار اللغة مباشرة</label>
        <button type="submit" className="admin-primary-button">إضافة اللغة</button>
      </form>
    </section>

    <section className="admin-card">
      <div className="admin-card-heading">
        <div><h2>اللغات الحالية</h2><p className="admin-muted">زر «إظهار/إخفاء» يتحكم في ظهور اللغة للزوار، بينما الحذف يزيل إعداد اللغة من النظام.</p></div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-languages-table">
          <thead><tr><th>اللغة</th><th>الرمز</th><th>الاتجاه</th><th>الترتيب</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
          <tbody>
            {languages.map(language=>{
              const primary=language.code==="ar";
              return <tr key={language.code}>
                <td><strong>{language.nameAr}</strong><small>{language.nameNative}{primary?" · اللغة الأم":""}</small></td>
                <td><code>{language.code}</code></td>
                <td>
                  <select value={language.direction} disabled={primary||busy===language.code} onChange={e=>updateDirection(language,e.target.value==="rtl"?"rtl":"ltr")}>
                    <option value="ltr">LTR</option><option value="rtl">RTL</option>
                  </select>
                </td>
                <td><input className="admin-language-order" type="number" min="1" value={language.sortOrder} disabled={busy===language.code} onChange={e=>setLanguages(cur=>cur.map(item=>item.code===language.code?{...item,sortOrder:Number(e.target.value)}:item))} onBlur={e=>updateOrder({...language,sortOrder:Number(e.target.value)},Number(e.target.value))}/></td>
                <td><span className={`admin-status ${language.enabled?"published":"draft"}`}>{language.enabled?"مفعلة":"مخفية"}</span></td>
                <td>
                  <div className="admin-language-actions">
                    <button type="button" className="admin-secondary-button" disabled={primary||busy===language.code} onClick={()=>toggleLanguage(language)}>
                      {language.enabled?"إخفاء اللغة":"إظهار اللغة"}
                    </button>
                    {!primary&&<button type="button" className="admin-danger-button" disabled={busy===language.code} onClick={()=>removeLanguage(language)}>حذف</button>}
                  </div>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
}
