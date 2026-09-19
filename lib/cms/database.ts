import { randomUUID } from "node:crypto";
import { defaultContent } from "./default-content";
import { supabaseRequest } from "@/lib/supabase-rest";
import type {
  CmsActivityLog,
  CmsContentItem,
  CmsContentSeed,
  CmsContentType,
  CmsFormSubmission,
  CmsMediaAsset,
  CmsNotFoundHit,
  CmsRedirect,
  CmsRevision,
  CmsStatus
} from "./types";

type Row = Record<string, unknown>;

function now() { return new Date().toISOString(); }
function enc(value: string) { return encodeURIComponent(value); }
function parseMeta(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch { return {}; }
}

function rowToContent(row: Row): CmsContentItem {
  return {
    id: String(row.id),
    type: row.type as CmsContentType,
    slug: String(row.slug),
    titleAr: String(row.title_ar ?? ""),
    titleEn: String(row.title_en ?? ""),
    summaryAr: String(row.summary_ar ?? ""),
    summaryEn: String(row.summary_en ?? ""),
    bodyAr: String(row.body_ar ?? ""),
    bodyEn: String(row.body_en ?? ""),
    category: String(row.category ?? ""),
    status: row.status as CmsStatus,
    sortOrder: Number(row.sort_order ?? 0),
    meta: parseMeta(row.meta_json),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}
function rowToMedia(row: Row): CmsMediaAsset {
  return {
    id: String(row.id), filename: String(row.filename), url: String(row.url), mimeType: String(row.mime_type),
    sizeBytes: Number(row.size_bytes ?? 0), width: row.width == null ? null : Number(row.width), height: row.height == null ? null : Number(row.height),
    createdAt: String(row.created_at ?? ""), isProtected: Boolean(row.is_protected ?? true), watermarkEnabled: Boolean(row.watermark_enabled ?? false),
    watermarkText: String(row.watermark_text ?? "AbdulAziz Alsari | abdulazizalsari.net"),
    publicFormats: Array.isArray(row.public_formats) ? row.public_formats.map(String) : ["webp", "avif"],
    altAr: String(row.alt_ar ?? row.filename ?? ""), altEn: String(row.alt_en ?? row.filename ?? "")
  };
}
function rowToRevision(row: Row): CmsRevision {
  return { id: String(row.id), contentId: String(row.content_id), snapshot: (typeof row.snapshot_json === "string" ? JSON.parse(row.snapshot_json) : row.snapshot_json) as CmsContentItem, createdAt: String(row.created_at ?? "") };
}
function rowToActivity(row: Row): CmsActivityLog { return { id: String(row.id), event: String(row.event), createdAt: String(row.created_at ?? "") }; }
function rowToRedirect(row: Row): CmsRedirect { return { id: String(row.id), oldUrl: String(row.old_url), newUrl: String(row.new_url ?? ""), statusCode: Number(row.status_code) as 301|302|410, active: Boolean(row.active), createdAt: String(row.created_at ?? "") }; }
function rowToSubmission(row: Row): CmsFormSubmission { return { id: String(row.id), name: String(row.name ?? ""), email: String(row.email ?? ""), phone: String(row.phone ?? ""), message: String(row.message ?? ""), source: String(row.source ?? "contact"), status: String(row.status ?? "new") as CmsFormSubmission["status"], notes: String(row.notes ?? ""), payload: parseMeta(row.payload_json), createdAt: String(row.created_at ?? "") }; }
function rowToNotFound(row: Row): CmsNotFoundHit { return { id: String(row.id), path: String(row.path), referrer: String(row.referrer ?? ""), userAgent: String(row.user_agent ?? ""), count: Number(row.count ?? 1), firstSeenAt: String(row.first_seen_at ?? ""), lastSeenAt: String(row.last_seen_at ?? "") }; }

function fallbackContent(): CmsContentItem[] {
  const stamp = "2026-01-01T00:00:00.000Z";
  return defaultContent.map((item, index) => ({ ...item, id: `fallback-${index+1}`, createdAt: stamp, updatedAt: stamp }));
}

async function logActivity(event: string) {
  try {
    await supabaseRequest("/rest/v1/activity_logs", { method: "POST", body: { id: randomUUID(), event, created_at: now() }, headers: { Prefer: "return=minimal" } });
  } catch { /* public requests are not allowed to write activity logs */ }
}

export async function listContentItems({ publishedOnly = false }: { publishedOnly?: boolean } = {}) {
  try {
    const filter = publishedOnly ? "&status=eq.published" : "";
    const rows = await supabaseRequest<Row[]>(`/rest/v1/content_items?select=*&deleted_at=is.null${filter}&order=type.asc,sort_order.asc,updated_at.desc`);
    return rows.map(rowToContent);
  } catch {
    const rows = fallbackContent();
    return publishedOnly ? rows.filter((i)=>i.status==="published") : rows;
  }
}
export async function listDeletedContentItems() {
  const rows = await supabaseRequest<Row[]>("/rest/v1/content_items?select=*&deleted_at=not.is.null&order=updated_at.desc");
  return rows.map(rowToContent);
}
export async function listContentByType(type: CmsContentType, { publishedOnly = false }: { publishedOnly?: boolean } = {}) {
  try {
    const filter = publishedOnly ? "&status=eq.published" : "";
    const rows = await supabaseRequest<Row[]>(`/rest/v1/content_items?select=*&type=eq.${enc(type)}&deleted_at=is.null${filter}&order=sort_order.asc,updated_at.desc`);
    return rows.map(rowToContent);
  } catch {
    return (await listContentItems({ publishedOnly })).filter((i)=>i.type===type);
  }
}
export async function getContentBySlug(type: CmsContentType, slug: string) {
  const rows = await supabaseRequest<Row[]>(`/rest/v1/content_items?select=*&type=eq.${enc(type)}&slug=eq.${enc(slug)}&deleted_at=is.null&limit=1`);
  return rows[0] ? rowToContent(rows[0]) : null;
}
export async function getContentById(id: string) {
  const rows = await supabaseRequest<Row[]>(`/rest/v1/content_items?select=*&id=eq.${enc(id)}&deleted_at=is.null&limit=1`);
  return rows[0] ? rowToContent(rows[0]) : null;
}
function cleanSlug(slug: string) { return slug.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,""); }
function contentPublicPath(item: CmsContentItem) {
  if (item.type==="article") return `/ruaa/${item.slug}`;
  if (item.type==="service") return `/services/${item.slug}`;
  if (item.type==="course") return `/training/${item.slug}`;
  if (item.type==="privacy") return "/privacy-policy";
  return "";
}
export async function saveContentItem(input: Partial<CmsContentItem> & CmsContentSeed) {
  const stamp=now(); const id=input.id||randomUUID(); const slug=cleanSlug(input.slug); const previous=input.id?await getContentById(input.id):null;
  if(!slug) throw new Error("Slug is required."); if(!input.titleAr?.trim()) throw new Error("Arabic title is required.");
  const row={id,type:input.type,slug,title_ar:input.titleAr.trim(),title_en:input.titleEn?.trim()??"",summary_ar:input.summaryAr?.trim()??"",summary_en:input.summaryEn?.trim()??"",body_ar:input.bodyAr?.trim()??"",body_en:input.bodyEn?.trim()??"",category:input.category?.trim()??"",status:["published","scheduled","archived"].includes(String(input.status))?input.status:"draft",sort_order:Number(input.sortOrder??0),meta_json:input.meta??{},created_at:input.createdAt??previous?.createdAt??stamp,updated_at:stamp,deleted_at:null};
  if(previous) await supabaseRequest("/rest/v1/content_revisions",{method:"POST",body:{id:randomUUID(),content_id:previous.id,snapshot_json:previous,created_at:stamp},headers:{Prefer:"return=minimal"}});
  const rows=await supabaseRequest<Row[]>(`/rest/v1/content_items?on_conflict=id`,{method:"POST",body:row,headers:{Prefer:"resolution=merge-duplicates,return=representation"}});
  const saved=rowToContent(rows[0]);
  if(previous&&previous.slug!==saved.slug){ const oldUrl=contentPublicPath(previous),newUrl=contentPublicPath(saved); if(oldUrl&&newUrl) await saveRedirect({oldUrl,newUrl,statusCode:301}); }
  await logActivity(`${previous?"Updated":"Created"} ${saved.type}: ${saved.titleAr||saved.titleEn||saved.slug}`); return saved;
}
export async function deleteContentItem(id:string){ const item=await getContentById(id); if(!item)return false; await supabaseRequest(`/rest/v1/content_items?id=eq.${enc(id)}`,{method:"PATCH",body:{deleted_at:now(),status:"archived",updated_at:now()},headers:{Prefer:"return=minimal"}}); await logActivity(`Archived ${item.type}: ${item.titleAr||item.titleEn||item.slug}`); return true; }
export async function restoreContentItem(id:string){ await supabaseRequest(`/rest/v1/content_items?id=eq.${enc(id)}`,{method:"PATCH",body:{deleted_at:null,status:"draft",updated_at:now()},headers:{Prefer:"return=minimal"}}); return getContentById(id); }
export async function listRevisions(contentId:string){ const rows=await supabaseRequest<Row[]>(`/rest/v1/content_revisions?select=*&content_id=eq.${enc(contentId)}&order=created_at.desc`); return rows.map(rowToRevision); }
export async function listActivityLogs(limit=30){ const rows=await supabaseRequest<Row[]>(`/rest/v1/activity_logs?select=*&order=created_at.desc&limit=${limit}`); return rows.map(rowToActivity); }
export async function listRedirects(){ const rows=await supabaseRequest<Row[]>("/rest/v1/redirects?select=*&order=created_at.desc"); return rows.map(rowToRedirect); }
export async function saveRedirect(input:Partial<CmsRedirect>&Pick<CmsRedirect,"oldUrl"|"newUrl"|"statusCode">){ const oldUrl=input.oldUrl.trim(),newUrl=input.statusCode===410?"":input.newUrl.trim(); if(!oldUrl.startsWith("/"))throw new Error("Old URL must start with /."); if(input.statusCode!==410&&!newUrl.startsWith("/"))throw new Error("New URL must start with /."); const row={id:input.id??randomUUID(),old_url:oldUrl,new_url:newUrl,status_code:input.statusCode,active:input.active!==false,created_at:input.createdAt??now()}; const rows=await supabaseRequest<Row[]>("/rest/v1/redirects?on_conflict=old_url",{method:"POST",body:row,headers:{Prefer:"resolution=merge-duplicates,return=representation"}}); return rowToRedirect(rows[0]); }
export async function deleteRedirect(id:string){ await supabaseRequest(`/rest/v1/redirects?id=eq.${enc(id)}`,{method:"DELETE",headers:{Prefer:"return=minimal"}}); return true; }
export async function findActiveRedirect(pathname:string){ try{ const rows=await supabaseRequest<Row[]>(`/rest/v1/redirects?select=*&old_url=eq.${enc(pathname)}&active=eq.true&limit=1`); return rows[0]?rowToRedirect(rows[0]):null;}catch{return null;} }
export async function recordNotFound(_pathname:string,_referrer="",_userAgent=""){ return; }
export async function listNotFoundHits(limit=50){ const rows=await supabaseRequest<Row[]>(`/rest/v1/not_found_hits?select=*&order=last_seen_at.desc&limit=${limit}`); return rows.map(rowToNotFound); }
export async function listMediaAssets(){ const rows=await supabaseRequest<Row[]>("/rest/v1/media_assets?select=*&order=created_at.desc"); return rows.map(rowToMedia); }
export async function saveMediaAsset(input:Omit<CmsMediaAsset,"id"|"createdAt">&{id?:string;storagePath?:string}){ const row={id:input.id??randomUUID(),filename:input.filename,url:input.url,mime_type:input.mimeType,size_bytes:input.sizeBytes,width:input.width??null,height:input.height??null,storage_path:input.storagePath??null,is_protected:input.isProtected,watermark_enabled:input.watermarkEnabled,watermark_text:input.watermarkText,public_formats:input.publicFormats,alt_ar:input.altAr,alt_en:input.altEn,created_at:now()}; const rows=await supabaseRequest<Row[]>("/rest/v1/media_assets",{method:"POST",body:row,headers:{Prefer:"return=representation"}}); return rowToMedia(rows[0]); }
export async function updateMediaAsset(id:string,input:Partial<Pick<CmsMediaAsset,"altAr"|"altEn"|"isProtected"|"watermarkEnabled"|"watermarkText">>){ const patch:Row={}; if(input.altAr!==undefined)patch.alt_ar=input.altAr;if(input.altEn!==undefined)patch.alt_en=input.altEn;if(input.isProtected!==undefined)patch.is_protected=input.isProtected;if(input.watermarkEnabled!==undefined)patch.watermark_enabled=input.watermarkEnabled;if(input.watermarkText!==undefined)patch.watermark_text=input.watermarkText; const rows=await supabaseRequest<Row[]>(`/rest/v1/media_assets?id=eq.${enc(id)}`,{method:"PATCH",body:patch,headers:{Prefer:"return=representation"}}); return rows[0]?rowToMedia(rows[0]):null; }
export async function deleteMediaAsset(id:string){ await supabaseRequest(`/rest/v1/media_assets?id=eq.${enc(id)}`,{method:"DELETE",headers:{Prefer:"return=minimal"}}); return true; }
export async function createFormSubmission(input:Partial<CmsFormSubmission>){ const row={id:randomUUID(),name:String(input.name??"").trim(),email:String(input.email??"").trim(),phone:String(input.phone??"").trim(),message:String(input.message??"").trim(),source:String(input.source??"contact").trim()||"contact",status:"new",notes:"",payload_json:input.payload??{},created_at:now()}; await supabaseRequest("/rest/v1/form_submissions",{method:"POST",body:row,headers:{Prefer:"return=minimal"}}); return rowToSubmission(row); }
export async function listFormSubmissions(){ const rows=await supabaseRequest<Row[]>("/rest/v1/form_submissions?select=*&order=created_at.desc"); return rows.map(rowToSubmission); }
export async function updateFormSubmission(id:string,patch:Partial<Pick<CmsFormSubmission,"status"|"notes">>){ const body:Row={};if(patch.status!==undefined)body.status=patch.status;if(patch.notes!==undefined)body.notes=patch.notes;const rows=await supabaseRequest<Row[]>(`/rest/v1/form_submissions?id=eq.${enc(id)}`,{method:"PATCH",body,headers:{Prefer:"return=representation"}});return rows[0]?rowToSubmission(rows[0]):null; }
export async function getMediaAssetById(id:string){ const rows=await supabaseRequest<Row[]>(`/rest/v1/media_assets?select=*&id=eq.${enc(id)}&limit=1`); if(!rows[0])return null; return {...rowToMedia(rows[0]),storagePath:typeof rows[0].storage_path==="string"?rows[0].storage_path:null}; }
export async function exportCmsBackup(){ const result:Record<string,unknown[]>={}; for(const table of ["admin_profiles","content_items","media_assets","content_revisions","activity_logs","redirects","form_submissions","not_found_hits"]){ result[table]=await supabaseRequest<unknown[]>(`/rest/v1/${table}?select=*`); } return {version:3,provider:"supabase",exportedAt:now(),tables:result}; }
