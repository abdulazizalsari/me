"use client";

import { useMemo, useState } from "react";
import type { CmsContentItem, CmsRole } from "@/lib/cms/types";

type LocaleText = { ar: string; en: string };
type Point = LocaleText;
type Stat = { value: string; ar: string; en: string };
type Button = { ar: string; en: string; url: string };
type HomeContent = {
  hero: { eyebrow: LocaleText; title: LocaleText; description: LocaleText; primary: Button; secondary: Button; portraitStatus: LocaleText; portraitRole: LocaleText; portraitTags: LocaleText[] };
  intro: { text: LocaleText; button: Button };
  experience: { eyebrow: LocaleText; title: LocaleText; description: LocaleText; button: Button; points: Point[] };
  services: { eyebrow: LocaleText; title: LocaleText; description: LocaleText; limit: number };
  stats: { items: Stat[] };
  training: { eyebrow: LocaleText; title: LocaleText; description: LocaleText; slugs: string[] };
  expertise: { eyebrow: LocaleText; title: LocaleText; points: Point[] };
  cta: { title: LocaleText; description: LocaleText; whatsapp: LocaleText; contact: LocaleText };
  portraitImageAssetId?: string;
};
type Section = { key: string; label: string; visible: boolean; order: number };

const defaults: HomeContent = {
  hero: {
    eyebrow:{ar:"تسويق رقمي وتطوير أعمال",en:"Digital Marketing & Business Development"},
    title:{ar:"أساعدك على بناء حضور رقمي أقوى بتسويق عملي وتجربة احترافية",en:"I help you build a stronger digital presence with practical marketing and polished execution"},
    description:{ar:"أقدّم خدمات رقمية وتدريبًا عمليًا يجمع بين استراتيجية التسويق، إدارة الحملات، تصميم المواقع، تطوير الأعمال، وبناء تجربة واضحة تساعد مشروعك على النمو بثقة.",en:"I provide digital services and practical training across marketing strategy, campaign management, website design, business development, and clear execution that helps your project grow with confidence."},
    primary:{ar:"احجز استشارة",en:"Book a Consultation",url:"/consultation"},
    secondary:{ar:"معرفة المزيد",en:"Learn More",url:"/services"},
    portraitStatus:{ar:"حالة العمل",en:"CURRENT STATUS"},
    portraitRole:{ar:"مدرب ومطور",en:"TRAINER & DEVELOPER"},
    portraitTags:[{ar:"تسويق رقمي",en:"Digital Marketing"},{ar:"تطوير أعمال",en:"Business Development"},{ar:"تجارة دولية",en:"International Trade"}]
  },
  intro:{text:{ar:"أعمل في التسويق الرقمي والتدريب وتطوير الأعمال بخبرة تجمع بين التخطيط، التصميم، الحملات الإعلانية، وإدارة المشاريع. أركز على حلول عملية تناسب هدف المشروع وجمهوره بدل الاكتفاء بمظهر جميل فقط.",en:"I work across digital marketing, training, and business development with experience in planning, design, advertising campaigns, and project management. I focus on practical solutions shaped around each project's goals and audience."},button:{ar:"معرفة المزيد",en:"Learn More",url:"/about"}},
  experience:{eyebrow:{ar:"خبرة عملية ورؤية متكاملة",en:"Practical Experience and Integrated Vision"},title:{ar:"خبرة تجمع بين التسويق، تطوير الأعمال، والتدريب",en:"Experience Across Marketing, Business Development, and Training"},description:{ar:"أجمع بين خبرة عملية في التسويق الرقمي، التخطيط الاستراتيجي، تطوير الأعمال، تصميم المواقع، الحملات الإعلانية، التصميم الجرافيكي، وإدارة المشاريع، مع اهتمام واضح بالتجارة الدولية وبناء قدرات الأفراد والفرق.",en:"I combine practical experience in digital marketing, strategic planning, business development, websites, advertising campaigns, graphic design, project management, and international trade."},button:{ar:"عرض السيرة الذاتية",en:"View Professional Profile",url:"/cv"},points:["التسويق الرقمي","تطوير الأعمال","التدريب والاستشارات","التخطيط الاستراتيجي","تصميم المواقع","الحملات الإعلانية","التصميم الجرافيكي","إدارة المشاريع","التجارة الدولية"].map(v=>({ar:v,en:v}))},
  services:{eyebrow:{ar:"خدماتنا",en:"Services"},title:{ar:"كل ما يحتاجه مشروعك للنجاح",en:"Everything Your Project Needs to Succeed"},description:{ar:"تسع خدمات متكاملة مصممة خصيصاً لتناسب رؤيتك.",en:"Integrated services tailored to fit your goals and growth stage."},limit:5},
  stats:{items:[{value:"",ar:"",en:""},{value:"",ar:"",en:""},{value:"",ar:"",en:""},{value:"",ar:"",en:""}]},
  training:{eyebrow:{ar:"الدورات الخاصة",en:"Private Courses"},title:{ar:"تعلم التسويق والتصميم بمنهجية عملية",en:"Learn Marketing and Design Through Practice"},description:{ar:"برامج تدريبية واضحة تجمع بين المعرفة والتطبيق العملي.",en:"Structured training programs that connect knowledge with real execution."},slugs:["digital-marketing-course","graphic-design-course","wordpress-course"]},
  expertise:{eyebrow:{ar:"خبرة عملية",en:"Practical Expertise"},title:{ar:"استراتيجيات تسويقية فعالة وأداء رقمي قابل للقياس",en:"Effective Marketing Strategies and Measurable Digital Performance"},points:["تحسين موقعك وأدائك الرقمي","تحسين محركات البحث","تسويق B2B والتصدير","أدوات الذكاء الاصطناعي لتسريع أعمالك"].map(v=>({ar:v,en:v}))},
  cta:{title:{ar:"مستعد ترفع مستوى مشروعك؟",en:"Ready to Raise Your Project Level?"},description:{ar:"لا تدع منافسيك يتقدمون عليك — تواصل معنا الآن عبر واتساب واحصل على استشارة مجانية.",en:"Start with a practical conversation and a clear next step."},whatsapp:{ar:"تواصل عبر واتساب",en:"WhatsApp"},contact:{ar:"اتصل بنا",en:"Contact"}}
};

const sectionDefaults: Section[]=[
 {key:"hero",label:"Hero",visible:true,order:1},{key:"intro",label:"التعريف المختصر",visible:true,order:2},{key:"experience",label:"الخبرة",visible:true,order:3},{key:"services",label:"الخدمات",visible:true,order:4},{key:"stats",label:"الإحصائيات",visible:true,order:5},{key:"relatedProjects",label:"المشاريع ذات الصلة",visible:true,order:6},{key:"training",label:"الدورات",visible:true,order:7},{key:"expertise",label:"محاور الخبرة",visible:true,order:8},{key:"insights",label:"رؤى",visible:true,order:9},{key:"cta",label:"CTA",visible:true,order:10}
];

function mergeDefaults(raw:Record<string,unknown>|undefined):HomeContent{
  const r=raw&&typeof raw==="object"?raw as Record<string,unknown>:{};
  return {...defaults,...r,hero:{...defaults.hero,...(r.hero as object||{})},intro:{...defaults.intro,...(r.intro as object||{})},experience:{...defaults.experience,...(r.experience as object||{})},services:{...defaults.services,...(r.services as object||{})},stats:{...defaults.stats,...(r.stats as object||{})},training:{...defaults.training,...(r.training as object||{})},expertise:{...defaults.expertise,...(r.expertise as object||{})},cta:{...defaults.cta,...(r.cta as object||{})}} as HomeContent;
}

function txt(v:unknown,f:LocaleText):LocaleText{const r=v&&typeof v==="object"?v as Record<string,unknown>:{};return {ar:typeof r.ar==="string"?r.ar:f.ar,en:typeof r.en==="string"?r.en:f.en};}
function field(v:unknown,f:string,locale:"ar"|"en"){return txt(v, {ar:"",en:""})[locale]||f;}

export function HomepageAdminClient({homepage,role}:{homepage:CmsContentItem|null;role:CmsRole}){
  const raw=(homepage?.meta??{}) as Record<string,unknown>;
  const initialSections=Array.isArray(raw.homeSections)?(raw.homeSections as Record<string,unknown>[]).map((s,i)=>({key:String(s.key),label:sectionDefaults.find(x=>x.key===s.key)?.label||String(s.key),visible:s.visible!==false,order:typeof s.order==="number"?s.order:i+1})):sectionDefaults;
  const [content,setContent]=useState<HomeContent>(mergeDefaults(raw.homepageContent));
  const [sections,setSections]=useState<Section[]>(initialSections);
  const [active,setActive]=useState("hero");
  const [locale,setLocale]=useState<"ar"|"en">("ar");
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const update=(path:string,value:unknown)=>{
    setContent(cur=>{const next=structuredClone(cur) as any;const parts=path.split(".");let o=next;for(let i=0;i<parts.length-1;i++)o=o[parts[i]];o[parts.at(-1)!]=value;return next;});
  };
  const t=(path:string, fallback="")=>{let o:any=content;for(const p of path.split("."))o=o?.[p];return field(o,fallback,locale);};
  const setT=(path:string,value:string)=>{let o:any=content;const parts=path.split(".");for(let i=0;i<parts.length-1;i++)o=o[parts[i]]??(o[parts[i]]={});const k=parts.at(-1)!;o[k]={...(o[k]||{ar:"",en:""}),[locale]:value};setContent({...content});};
  const section=useMemo(()=>sections.find(s=>s.key===active),[sections,active]);
  function toggleSection(key:string){setSections(s=>s.map(x=>x.key===key?{...x,visible:!x.visible}:x));}
  function moveSection(key:string,d:-1|1){setSections(s=>{const ordered=[...s].sort((a,b)=>a.order-b.order);const i=ordered.findIndex(x=>x.key===key),j=i+d;if(i<0||j<0||j>=ordered.length)return s;[ordered[i],ordered[j]]=[ordered[j],ordered[i]];return ordered.map((x,i)=>({...x,order:i+1}));});}
  async function save(){
    setBusy(true);setMessage("");
    const meta={...raw,homepageContent:content,homeSections:sections.map(({key,visible,order})=>({key,visible,order}))};
    const body={id:homepage?.id,type:"homepage",slug:homepage?.slug||"homepage",titleAr:homepage?.titleAr||"الصفحة الرئيسية",titleEn:homepage?.titleEn||"Homepage",summaryAr:homepage?.summaryAr||"",summaryEn:homepage?.summaryEn||"",bodyAr:homepage?.bodyAr||"",bodyEn:homepage?.bodyEn||"",category:homepage?.category||"System",status:"published",sortOrder:homepage?.sortOrder||1,meta};
    const r=await fetch("/api/admin/content",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const d=await r.json().catch(()=>({}));setBusy(false);setMessage(r.ok?"تم حفظ الصفحة الرئيسية بنجاح.":(d.message||"تعذر الحفظ."));
  }
  const input=(label:string,path:string)=> <label>{label}<input value={t(path)} onChange={e=>setT(path,e.target.value)}/></label>;
  const textarea=(label:string,path:string,rows=4)=> <label>{label}<textarea rows={rows} value={t(path)} onChange={e=>setT(path,e.target.value)}/></label>;
  const buttonFields=(base:string)=> <div className="admin-form-row">{input("النص",base+".ar")} {input("الرابط",base+".url")}</div>;

  return <div className="homepage-admin">
    <div className="admin-card homepage-section-list">
      <div className="admin-card-head"><div><h2>أقسام الصفحة الرئيسية</h2><p className="muted">كل قسم مستقل. يمكنك إخفاؤه أو تغيير ترتيبه ثم فتحه للتحرير.</p></div><div className="admin-language-tabs"><button className={locale==="ar"?"active":""} onClick={()=>setLocale("ar")}>العربية</button><button className={locale==="en"?"active":""} onClick={()=>setLocale("en")}>English</button></div></div>
      <div className="homepage-section-buttons">{[...sections].sort((a,b)=>a.order-b.order).map(s=><div className={active===s.key?"homepage-section-row active":"homepage-section-row"} key={s.key}><button type="button" onClick={()=>setActive(s.key)}><strong>{s.label}</strong><small>الترتيب {s.order}</small></button><label><input type="checkbox" checked={s.visible} onChange={()=>toggleSection(s.key)}/> ظاهر</label><div><button type="button" onClick={()=>moveSection(s.key,-1)}>↑</button><button type="button" onClick={()=>moveSection(s.key,1)}>↓</button></div></div>)}</div>
    </div>
    <div className="admin-card homepage-editor">
      <div className="admin-card-head"><div><h2>{section?.label||"القسم"}</h2><p className="muted">تحرير هذا القسم فقط.</p></div><button className="admin-primary-button" disabled={busy} onClick={save}>{busy?"جار الحفظ...":"حفظ الصفحة الرئيسية"}</button></div>
      {active==="hero"&&<div className="admin-form">
        {input("العنوان الصغير","hero.eyebrow")}{textarea("العنوان الرئيسي","hero.title",3)}{textarea("الوصف","hero.description",5)}
        <h3>الزر الأول</h3>{input("النص","hero.primary")}{input("الرابط","hero.primary.url")}
        <h3>الزر الثاني</h3>{input("النص","hero.secondary")}{input("الرابط","hero.secondary.url")}
        {input("عنوان حالة العمل","hero.portraitStatus")}{input("المسمى","hero.portraitRole")}
      </div>}
      {active==="intro"&&<div className="admin-form">{textarea("النص","intro.text",5)}{input("نص الزر","intro.button")}{input("رابط الزر","intro.button.url")}</div>}
      {active==="experience"&&<div className="admin-form">{input("العنوان الصغير","experience.eyebrow")}{textarea("العنوان","experience.title",3)}{textarea("الوصف","experience.description",5)}{input("نص الزر","experience.button")}{input("رابط الزر","experience.button.url")}<h3>نقاط الخبرة</h3>{content.experience.points.map((p,i)=><div className="admin-form-row" key={i}><input value={p[locale]} onChange={e=>setContent(c=>({...c,experience:{...c.experience,points:c.experience.points.map((x,j)=>j===i?{...x,[locale]:e.target.value}:x)}}))}/><button type="button" onClick={()=>setContent(c=>({...c,experience:{...c.experience,points:c.experience.points.filter((_,j)=>j!==i)}}))}>حذف</button></div>)}<button type="button" className="admin-secondary-button" onClick={()=>setContent(c=>({...c,experience:{...c.experience,points:[...c.experience.points,{ar:"",en:""}]}}))}>+ إضافة نقطة</button></div>}
      {active==="services"&&<div className="admin-form">{input("العنوان الصغير","services.eyebrow")}{textarea("العنوان","services.title",3)}{textarea("الوصف","services.description",4)}<label>عدد الخدمات الظاهرة<input type="number" min={1} max={20} value={content.services.limit} onChange={e=>update("services.limit",Number(e.target.value))}/></label><p className="muted">بطاقات الخدمات نفسها تُدار من قسم «الخدمات» في اللوحة، وهنا تتحكم فقط في شكل القسم وعدد البطاقات.</p></div>}
      {active==="stats"&&<div className="admin-form"><p className="muted">يمكنك تعريف الأرقام والعناوين التي تظهر في الشريط الإحصائي.</p>{content.stats.items.map((s,i)=><div className="admin-card" key={i}><div className="admin-form-row"><input placeholder="القيمة" value={s.value} onChange={e=>setContent(c=>({...c,stats:{items:c.stats.items.map((x,j)=>j===i?{...x,value:e.target.value}:x)}}))}/><input placeholder={locale==="ar"?"العنوان":"Title"} value={s[locale]} onChange={e=>setContent(c=>({...c,stats:{items:c.stats.items.map((x,j)=>j===i?{...x,[locale]:e.target.value}:x)}}))}/><button type="button" onClick={()=>setContent(c=>({...c,stats:{items:c.stats.items.filter((_,j)=>j!==i)}}))}>حذف</button></div></div>)}<button type="button" className="admin-secondary-button" onClick={()=>setContent(c=>({...c,stats:{items:[...c.stats.items,{value:"",ar:"",en:""}]}}))}>+ إضافة إحصائية</button></div>}
      {active==="training"&&<div className="admin-form">{input("العنوان الصغير","training.eyebrow")}{textarea("العنوان","training.title",3)}{textarea("الوصف","training.description",4)}<label>Slugs الدورات (واحد في كل سطر)<textarea rows={5} value={content.training.slugs.join("\n")} onChange={e=>update("training.slugs",e.target.value.split("\n").map(x=>x.trim()).filter(Boolean))}/></label></div>}
      {active==="expertise"&&<div className="admin-form">{input("العنوان الصغير","expertise.eyebrow")}{textarea("العنوان","expertise.title",3)}<h3>النقاط</h3>{content.expertise.points.map((p,i)=><div className="admin-form-row" key={i}><input value={p[locale]} onChange={e=>setContent(c=>({...c,expertise:{...c.expertise,points:c.expertise.points.map((x,j)=>j===i?{...x,[locale]:e.target.value}:x)}}))}/><button type="button" onClick={()=>setContent(c=>({...c,expertise:{...c.expertise,points:c.expertise.points.filter((_,j)=>j!==i)}}))}>حذف</button></div>)}<button type="button" className="admin-secondary-button" onClick={()=>setContent(c=>({...c,expertise:{...c.expertise,points:[...c.expertise.points,{ar:"",en:""}]}}))}>+ إضافة نقطة</button></div>}
      {active==="insights"&&<div className="admin-form"><p className="muted">قسم رؤى له لوحة مستقلة ضمن المحتوى. من هنا تتحكم فقط في ظهور وترتيب القسم.</p></div>}
      {active==="cta"&&<div className="admin-form">{textarea("العنوان","cta.title",3)}{textarea("الوصف","cta.description",4)}{input("زر واتساب","cta.whatsapp")}{input("زر التواصل","cta.contact")}</div>}
      {message&&<p className="admin-message">{message}</p>}
    </div>
  </div>;
}
