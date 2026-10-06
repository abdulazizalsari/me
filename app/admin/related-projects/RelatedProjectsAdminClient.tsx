"use client";

import { useMemo, useState } from "react";
import type { CmsContentItem, CmsRole } from "@/lib/cms/types";

type Props={projects:CmsContentItem[];homepage:CmsContentItem|null;role:CmsRole};
type RelatedConfig={slug:string;image?:string;href?:string;isProtected?:boolean;watermarkEnabled?:boolean};

function readSettings(homepage:CmsContentItem|null){
  const meta=(homepage?.meta??{}) as Record<string,unknown>;
  const slugs=Array.isArray(meta.relatedProjectSlugs)?meta.relatedProjectSlugs.filter((v):v is string=>typeof v==="string"):[];
  const raw=meta.relatedProjectConfig&&typeof meta.relatedProjectConfig==="object"?meta.relatedProjectConfig as Record<string,unknown>:{};
  const config:Record<string,RelatedConfig>={};
  for(const [slug,value] of Object.entries(raw)){
    if(value&&typeof value==="object"){
      const item=value as Record<string,unknown>;
      config[slug]={slug,image:typeof item.image==="string"?item.image:"",href:typeof item.href==="string"?item.href:"",isProtected:item.isProtected!==false,watermarkEnabled:item.watermarkEnabled===true};
    }
  }
  const heading=meta.relatedProjectsHeading&&typeof meta.relatedProjectsHeading==="object"?meta.relatedProjectsHeading as Record<string,unknown>:{};
  return {
    visible:!Array.isArray(meta.homeSections)||(meta.homeSections as Record<string,unknown>[]).find(s=>s.key==="relatedProjects")?.visible!==false,
    ar:typeof heading.ar==="string"?heading.ar:"المشاريع ذات الصلة",en:typeof heading.en==="string"?heading.en:"Related Projects",
    autoPlay:meta.relatedProjectsAutoPlay!==false,interval:typeof meta.relatedProjectsInterval==="number"?Math.max(3,Math.min(60,meta.relatedProjectsInterval)):8,slugs,config
  };
}

export function RelatedProjectsAdminClient({projects,homepage,role}:Props){
  const initial=useMemo(()=>readSettings(homepage),[homepage]);
  const [visible,setVisible]=useState(initial.visible),[ar,setAr]=useState(initial.ar),[en,setEn]=useState(initial.en);
  const [autoPlay,setAutoPlay]=useState(initial.autoPlay),[interval,setIntervalValue]=useState(initial.interval);
  const [selected,setSelected]=useState<string[]>(initial.slugs.length?initial.slugs:projects.map(p=>p.slug));
  const [config,setConfig]=useState<Record<string,RelatedConfig>>(initial.config);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[media,setMedia]=useState<{id:string;url:string;filename:string}[]>([]);
  const [mediaOpen,setMediaOpen]=useState<string|null>(null),[uploading,setUploading]=useState<string|null>(null);

  function toggle(slug:string){setSelected(c=>c.includes(slug)?c.filter(s=>s!==slug):[...c,slug]);}
  function move(slug:string,direction:-1|1){setSelected(current=>{const i=current.indexOf(slug),n=i+direction;if(i<0||n<0||n>=current.length)return current;const copy=[...current];[copy[i],copy[n]]=[copy[n],copy[i]];return copy;});}
  function updateConfig(slug:string,field:keyof RelatedConfig,value:string|boolean){setConfig(c=>({...c,[slug]:{...(c[slug]??{slug}),slug,[field]:value}}));}

  async function loadMedia(slug:string){
    setMediaOpen(slug);
    if(media.length)return;
    const r=await fetch("/api/admin/media"); const d=await r.json().catch(()=>({}));
    if(r.ok)setMedia(Array.isArray(d.media)?d.media.map((m:any)=>({id:m.id,url:m.url,filename:m.filename||m.id})):[]);
  }
  async function uploadImage(slug:string,file:File){
    setUploading(slug);setMessage("");
    const fd=new FormData();fd.append("file",file);fd.append("watermarkEnabled","false");
    const r=await fetch("/api/admin/media",{method:"POST",body:fd});const d=await r.json().catch(()=>({}));
    setUploading(null);
    if(!r.ok||!d.asset){setMessage(d.message||"تعذر رفع الصورة.");return;}
    const url=String(d.asset.url||"");
    updateConfig(slug,"image",url);
    setMedia(cur=>[{id:String(d.asset.id),url,filename:String(d.asset.filename||file.name)},...cur]);
    setMessage("تم رفع الصورة واختيارها للمشروع.");
  }

  async function save(){
    if(role!=="admin"&&role!=="editor")return;
    setBusy(true);setMessage("");
    const ordered=selected;
    const relatedProjectConfig=Object.fromEntries(ordered.map(slug=>[slug,{
      image:config[slug]?.image||"",href:config[slug]?.href||"",
      isProtected:config[slug]?.isProtected!==false,watermarkEnabled:config[slug]?.watermarkEnabled===true
    }]));
    const response=await fetch("/api/admin/related-projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({visible,titleAr:ar,titleEn:en,autoPlay,interval,relatedProjectSlugs:ordered,relatedProjectConfig})});
    const data=await response.json().catch(()=>({}));setBusy(false);
    setMessage(response.ok?"تم حفظ إعدادات المشاريع ذات الصلة بنجاح.":(data.message||"تعذر الحفظ."));
  }

  return <div className="admin-content-layout">
    <section className="admin-card admin-list-panel">
      <div className="admin-card-head"><div><h2>إعدادات القسم</h2><p className="muted">هذه الإعدادات مرتبطة مباشرة بالسلايدر الموجود في الصفحة الرئيسية.</p></div><label className="admin-switch-row"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/><span>إظهار القسم</span></label></div>
      <div className="admin-form">
        <div className="admin-form-row"><label>العنوان بالعربية<input value={ar} onChange={e=>setAr(e.target.value)}/></label><label dir="ltr">English title<input value={en} onChange={e=>setEn(e.target.value)}/></label></div>
        <div className="admin-form-row"><label className="admin-switch-row"><input type="checkbox" checked={autoPlay} onChange={e=>setAutoPlay(e.target.checked)}/><span>تشغيل تلقائي للسلايدر</span></label><label>الفاصل بالثواني<input type="number" min={3} max={60} value={interval} onChange={e=>setIntervalValue(Number(e.target.value))}/></label></div>
      </div>
    </section>

    <section className="admin-card admin-list-panel">
      <div className="admin-card-head"><div><h2>المشاريع</h2><p className="muted">اختر المشاريع وحدد الصورة أو الشعار والرابط وإعدادات حماية الصورة والعلامة المائية.</p></div><span className="admin-status published">{selected.length} محدد</span></div>
      <div className="admin-table-wrap"><table>
        <thead><tr><th>ظهور</th><th>المشروع</th><th>الصورة / الشعار</th><th>الرابط</th><th>الحماية والعلامة المائية</th><th>الترتيب</th></tr></thead>
        <tbody>{projects.map(project=>{
          const checked=selected.includes(project.slug);
          const item=config[project.slug]??{slug:project.slug};
          const image=item.image||(typeof project.meta?.image==="string"?project.meta.image:"");
          const href=item.href||(typeof project.meta?.projectUrl==="string"?project.meta.projectUrl:typeof project.meta?.websiteUrl==="string"?project.meta.websiteUrl:typeof project.meta?.url==="string"?project.meta.url:"");
          return <tr key={project.slug}>
            <td><input type="checkbox" checked={checked} onChange={()=>toggle(project.slug)}/></td>
            <td><strong>{project.titleAr||project.titleEn}</strong><small>{project.slug}</small></td>
            <td>
              <div className="admin-language-actions">
                <input dir="ltr" value={image} onChange={e=>updateConfig(project.slug,"image",e.target.value)} placeholder="رابط الصورة أو الشعار"/>
                <button type="button" className="admin-secondary-button" onClick={()=>loadMedia(project.slug)}>اختيار من الوسائط</button>
                <label className="admin-secondary-button" style={{cursor:"pointer"}}>رفع صورة مباشرة<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden disabled={uploading===project.slug} onChange={e=>{const file=e.target.files?.[0];if(file)uploadImage(project.slug,file);e.currentTarget.value="";}}/></label>
              </div>
              {mediaOpen===project.slug&&<div className="admin-card" style={{marginTop:8}}>
                <div className="admin-card-head"><strong>الوسائط المحفوظة</strong><button type="button" className="admin-secondary-button" onClick={()=>setMediaOpen(null)}>إغلاق</button></div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:10}}>
                  {media.map(m=><button type="button" key={m.id} onClick={()=>{updateConfig(project.slug,"image",m.url);setMediaOpen(null);}} style={{padding:6,border:"1px solid #ddd",background:"transparent",cursor:"pointer"}}><img src={m.url} alt={m.filename} style={{width:"100%",height:80,objectFit:"cover"}}/><small>{m.filename}</small></button>)}
                  {!media.length&&<p className="muted">لا توجد صور محفوظة.</p>}
                </div>
              </div>}
            </td>
            <td><input dir="ltr" value={href} onChange={e=>updateConfig(project.slug,"href",e.target.value)} placeholder="https://..."/></td>
            <td>
              <label className="admin-switch-row"><input type="checkbox" checked={item.isProtected!==false} onChange={e=>updateConfig(project.slug,"isProtected",e.target.checked)}/><span>حماية الصورة</span></label>
              <label className="admin-switch-row"><input type="checkbox" checked={item.watermarkEnabled===true} onChange={e=>updateConfig(project.slug,"watermarkEnabled",e.target.checked)}/><span>العلامة المائية</span></label>
              <small className="muted">إلغاء الحماية لا يتيح زر تحميل أو سحب الصورة. وإلغاء العلامة المائية يزيل العلامة فقط.</small>
            </td>
            <td><div className="admin-actions"><button type="button" disabled={!checked} onClick={()=>move(project.slug,-1)}>↑</button><button type="button" disabled={!checked} onClick={()=>move(project.slug,1)}>↓</button></div></td>
          </tr>;
        })}{!projects.length&&<tr><td colSpan={6} className="admin-empty">لا توجد مشاريع في المحتوى.</td></tr>}</tbody>
      </table></div>
      {message&&<p className="admin-message">{message}</p>}
      <button className="admin-primary-button" disabled={busy} onClick={save}>{busy?"جار الحفظ...":"حفظ إعدادات المشاريع ذات الصلة"}</button>
    </section>
  </div>;
}
