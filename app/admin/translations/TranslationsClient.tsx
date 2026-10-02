"use client";

import { useMemo, useState } from "react";
import type { CmsLanguage, CmsRole } from "@/lib/cms/types";
import type { TranslationEntry } from "@/lib/cms/translations";

function csvCell(value:string){return '"'+String(value??"").replace(/"/g,'""')+'"';}
function toCsv(entries:TranslationEntry[],languages:CmsLanguage[]){const codes=languages.filter(l=>l.code!=="ar"&&l.enabled).map(l=>l.code);return "\ufeff"+[["key","ar",...codes],...entries.map(e=>[e.key,e.ar,...codes.map(c=>e.values[c]||"")])].map(row=>row.map(csvCell).join(",")).join("\r\n");}
function parseCsv(text:string){const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell="";}else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell);rows.push(row);row=[];cell="";}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}

export function TranslationsClient({initialLanguages,initialEntries,role}:{initialLanguages:CmsLanguage[];initialEntries:TranslationEntry[];role:CmsRole}){
 const [languages,setLanguages]=useState(initialLanguages);const [entries,setEntries]=useState(initialEntries);const [query,setQuery]=useState("");const [missing,setMissing]=useState(false);const [message,setMessage]=useState("");
 const active=languages.filter(l=>l.enabled);
 const filtered=useMemo(()=>entries.filter(e=>(!query||`${e.key} ${e.ar} ${Object.values(e.values).join(" ")}`.toLowerCase().includes(query.toLowerCase()))&&(!missing||active.some(l=>l.code!=="ar"&&!e.values[l.code]?.trim()))),[entries,query,missing,active]);
 async function save(key:string,language:string,value:string){setEntries(cur=>cur.map(e=>e.key===key?{...e,values:{...e.values,[language]:value}}:e));const r=await fetch("/api/admin/translations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"save",key,language,value})});if(!r.ok)setMessage("تعذر حفظ إحدى الترجمات.");}
 function download(name:string,text:string,type:string){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function exportFile(format:"csv"|"json"){if(format==="csv")download("site-translations.csv",toCsv(entries,languages),"text/csv;charset=utf-8");else{const codes=active.filter(l=>l.code!=="ar").map(l=>l.code);download("site-translations.json",JSON.stringify({source:"ar",languages:codes,entries:entries.map(e=>({key:e.key,ar:e.ar,...Object.fromEntries(codes.map(c=>[c,e.values[c]||""]))}))},null,2),"application/json");}}
 async function importFile(file:File){try{const text=(await file.text()).replace(/^\ufeff/,"");let rows:any[]=[];if(file.name.endsWith(".json")||/^\s*[\[{]/.test(text)){const j=JSON.parse(text);rows=Array.isArray(j)?j:(j.entries||[]);}else{const grid=parseCsv(text);const headers=(grid.shift()||[]).map(h=>h.trim());rows=grid.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||""])));}
  const r=await fetch("/api/admin/translations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"import",rows})});const d=await r.json();if(!r.ok)throw new Error(d.message);setMessage(`تم استيراد ${d.saved||0} ترجمة. أعد تحميل الصفحة لرؤية النتيجة.`);setTimeout(()=>location.reload(),800);
 }catch{setMessage("تعذر قراءة ملف الترجمة.");}}
 async function addLanguage(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const fd=new FormData(e.currentTarget);const code=String(fd.get("code")||"").trim();const nameAr=String(fd.get("nameAr")||"").trim();const nameNative=String(fd.get("nameNative")||"").trim();const direction=fd.get("direction")==="rtl"?"rtl":"ltr";const r=await fetch("/api/admin/translations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"language",code,nameAr,nameNative,direction})});if(r.ok){setLanguages(cur=>[...cur,{code,nameAr,nameNative,direction,enabled:true,sortOrder:100}]);e.currentTarget.reset();}else setMessage("تعذر إضافة اللغة.");}
 async function removeLanguage(code:string){if(role!=="admin"||!confirm("حذف هذه اللغة وكل ترجماتها؟"))return;const r=await fetch(`/api/admin/translations?code=${encodeURIComponent(code)}`,{method:"DELETE"});if(r.ok)setLanguages(cur=>cur.filter(l=>l.code!==code));}
 return <div className="admin-stack">
  <section className="admin-card">
   <div className="admin-translation-tools"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث في النصوص..."/><label className="admin-checkbox"><input type="checkbox" checked={missing} onChange={e=>setMissing(e.target.checked)}/> غير المترجم فقط</label><button onClick={()=>exportFile("csv")}>تصدير CSV</button><button onClick={()=>exportFile("json")}>تصدير JSON</button><label className="admin-file-button">استيراد CSV/JSON<input type="file" accept=".csv,.json" hidden onChange={e=>e.target.files?.[0]&&importFile(e.target.files[0])}/></label></div>
   <div className="admin-language-progress">{active.filter(l=>l.code!=="ar").map(l=>{const done=entries.filter(e=>e.values[l.code]?.trim()).length;const p=entries.length?Math.round(done/entries.length*100):0;return <div key={l.code}><strong>{l.nameAr}</strong><span>{p}%</span><i><b style={{width:`${p}%`}}/></i>{role==="admin"&&<button onClick={()=>removeLanguage(l.code)}>×</button>}</div>;})}</div>
   {role==="admin"&&<form className="admin-add-language" onSubmit={addLanguage}><input name="code" dir="ltr" placeholder="tr" required/><input name="nameAr" placeholder="التركية" required/><input name="nameNative" placeholder="Türkçe" required/><select name="direction"><option value="ltr">LTR</option><option value="rtl">RTL</option></select><button className="admin-primary-button">إضافة لغة</button></form>}
   {message&&<p className="admin-message">{message}</p>}
  </section>
  <section className="admin-card admin-translation-table-card"><div className="admin-table-wrap"><table className="admin-translation-table"><thead><tr><th>المفتاح</th><th>العربية · اللغة الأم</th>{active.filter(l=>l.code!=="ar").map(l=><th key={l.code}>{l.nameAr}</th>)}</tr></thead><tbody>
  {filtered.map(entry=><tr key={entry.key}><td><small>{entry.group}</small><code>{entry.key}</code></td><td>{entry.ar}</td>{active.filter(l=>l.code!=="ar").map(l=><td key={l.code}><textarea rows={2} defaultValue={entry.values[l.code]||""} dir={l.direction} onBlur={e=>save(entry.key,l.code,e.target.value)}/></td>)}</tr>)}
  </tbody></table></div></section>
 </div>;
}
