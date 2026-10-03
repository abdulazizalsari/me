import type { CmsPuckPage } from "./types";
import { supabaseRequest } from "@/lib/supabase-rest";

type Row = Record<string, unknown>;
const reservedSlugs = new Set(["about","cv","services","training","ruaa","contact","consultation","privacy-policy","en","tr","admin","dashboard","api","robots.txt","sitemap.xml"]);

function parseObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string") { try { const parsed=JSON.parse(value); if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed)) return parsed; } catch {} }
  return {};
}
function rowToPage(row: Row): CmsPuckPage {
  return { id:String(row.id), slug:String(row.slug??""), titleAr:String(row.title_ar??""), titleEn:String(row.title_en??""), status:String(row.status??"draft") as CmsPuckPage["status"], data:parseObject(row.data_json), localeData:parseObject(row.locale_data), seo:parseObject(row.seo_json), createdAt:String(row.created_at??""), updatedAt:String(row.updated_at??"") };
}
export async function listPuckPages() {
  const rows=await supabaseRequest<Row[]>("/rest/v1/puck_pages?select=*&order=updated_at.desc");
  return rows.map(rowToPage);
}
export async function getPuckPage(idOrSlug:string) {
  const byId=/^[0-9a-f-]{36}$/i.test(idOrSlug); const field=byId?"id":"slug";
  const rows=await supabaseRequest<Row[]>(`/rest/v1/puck_pages?select=*&${field}=eq.${encodeURIComponent(idOrSlug)}&limit=1`);
  return rows[0]?rowToPage(rows[0]):null;
}
export async function createPuckPage(input:{slug:string;titleAr:string;titleEn?:string;userId:string}) {
  const slug=input.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
  if(!slug) throw new Error("الرابط المختصر غير صالح.");
  if(reservedSlugs.has(slug)) throw new Error("هذا الرابط مستخدم من صفحة أساسية في الموقع. اختر رابطًا آخر.");
  const row={slug,title_ar:input.titleAr.trim(),title_en:input.titleEn?.trim()??"",status:"draft",data_json:{content:[],root:{}},locale_data:{},seo_json:{},created_by:input.userId,updated_by:input.userId};
  const rows=await supabaseRequest<Row[]>("/rest/v1/puck_pages",{method:"POST",body:row,headers:{Prefer:"return=representation"}});
  return rowToPage(rows[0]);
}
export async function savePuckPage(id:string,input:{data?:Record<string,unknown>;userId:string;locale?:string;status?:CmsPuckPage["status"];titleAr?:string;titleEn?:string;seo?:Record<string,unknown>}) {
  const current=await getPuckPage(id); if(!current) return null;
  const patch:Record<string,unknown>={updated_by:input.userId,updated_at:new Date().toISOString()};
  const locale=input.locale||"ar";
  if(input.data){
    if(locale==="ar") patch.data_json=input.data;
    else patch.locale_data={...current.localeData,[locale]:input.data};
  }
  if(input.status) patch.status=input.status;
  if(input.titleAr!==undefined) patch.title_ar=input.titleAr;
  if(input.titleEn!==undefined) patch.title_en=input.titleEn;
  if(input.seo!==undefined) patch.seo_json=input.seo;
  const rows=await supabaseRequest<Row[]>(`/rest/v1/puck_pages?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",body:patch,headers:{Prefer:"return=representation"}});
  return rows[0]?rowToPage(rows[0]):null;
}
export async function deletePuckPage(id:string) {
  await supabaseRequest(`/rest/v1/puck_pages?id=eq.${encodeURIComponent(id)}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
}
export function dataForLocale(page:CmsPuckPage,locale:string) {
  if(locale==="ar") return page.data;
  const value=page.localeData?.[locale];
  return value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:null;
}

export function hasPuckTranslation(page:CmsPuckPage,locale:string) {
  if(locale==="ar") return true;
  const data=dataForLocale(page,locale);
  const content=data?.content;
  return Array.isArray(content) && content.length > 0;
}
