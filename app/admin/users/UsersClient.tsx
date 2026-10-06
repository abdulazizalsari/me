"use client";
import { useEffect, useState } from "react";

type Role = "admin" | "editor" | "writer" | "reviewer";
type UserRow = { id:string; email:string; displayName:string; role:Role; permissions:string[]; createdAt:string; lastSignInAt:string };

const permissionOptions = [
  ["articles_create","إنشاء المقالات"],
  ["articles_edit","تعديل المقالات"],
  ["articles_submit","إرسال المقالات للنشر"],
  ["articles_publish","نشر المقالات"],
  ["media_manage","إدارة الوسائط"],
  ["pages_manage","إدارة الصفحات"],
  ["requests_manage","إدارة الطلبات"],
  ["seo_manage","إدارة SEO"]
] as const;

export function UsersClient(){
 const [users,setUsers]=useState<UserRow[]>([]);
 const [message,setMessage]=useState("");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);

 async function load(){
  setLoading(true);
  const r=await fetch("/api/admin/users",{cache:"no-store"});
  const d=await r.json().catch(()=>({}));
  setLoading(false);
  if(r.ok)setUsers(d.users||[]);
  else setMessage(d.message||"تعذر تحميل المستخدمين.");
 }
 useEffect(()=>{void load();},[]);

 async function invite(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault(); setBusy(true); setMessage("");
  const fd=new FormData(e.currentTarget);
  const permissions=permissionOptions.map(([key])=>key).filter(key=>fd.getAll("permissions").includes(key));
  const r=await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    email:fd.get("email"),displayName:fd.get("displayName"),role:fd.get("role"),permissions
  })});
  const d=await r.json().catch(()=>({}));
  setBusy(false);
  if(!r.ok){setMessage(d.message||"تعذر إرسال الدعوة.");return;}
  setMessage(d.message||"تم إرسال دعوة المستخدم عبر البريد.");
  e.currentTarget.reset();
  void load();
 }
 async function patch(id:string,body:Record<string,unknown>){
  const r=await fetch("/api/admin/users",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,...body})});
  if(r.ok) await load(); else setMessage((await r.json().catch(()=>({}))).message||"تعذر التعديل.");
 }
 async function remove(id:string){
  if(!confirm("حذف هذا المستخدم من Supabase Auth؟"))return;
  const r=await fetch("/api/admin/users",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
  if(r.ok) await load(); else setMessage((await r.json().catch(()=>({}))).message||"تعذر الحذف.");
 }
 const defaultPermissions=(role:Role)=>role==="admin"?permissionOptions.map(([k])=>k):role==="writer"?["articles_create","articles_edit","articles_submit"]:role==="reviewer"?["articles_publish","articles_edit"]:["articles_create","articles_edit","articles_submit","media_manage"];
 return <div className="admin-stack">
  <form className="admin-card admin-inline-create" onSubmit={invite}>
   <h2>إضافة حساب</h2>
   <div className="admin-form-row three">
    <label>الاسم<input name="displayName" required/></label>
    <label>البريد<input name="email" type="email" dir="ltr" required/></label>
    <label>الدور<select name="role" defaultValue="writer" onChange={e=>{const role=e.target.value as Role; document.querySelectorAll<HTMLInputElement>('input[name="permissions"]').forEach((el)=>el.checked=defaultPermissions(role).includes(el.value));}}>
      <option value="writer">كاتب مقالات</option><option value="editor">محرر محتوى</option><option value="reviewer">مراجع / ناشر</option><option value="admin">مدير</option>
    </select></label>
   </div>
   <div className="admin-permissions-grid">
    <strong>الصلاحيات</strong>
    {permissionOptions.map(([key,label])=><label key={key}><input name="permissions" value={key} type="checkbox" defaultChecked={["articles_create","articles_edit","articles_submit"].includes(key)}/>{label}</label>)}
   </div>
   <button className="admin-primary-button" disabled={busy}>{busy?"جاري الإرسال...":"إرسال الدعوة"}</button>
   {message&&<p className="admin-message">{message}</p>}
  </form>
  <section className="admin-card"><div className="admin-table-wrap"><table><thead><tr><th>المستخدم</th><th>البريد</th><th>الدور</th><th>الصلاحيات</th><th>آخر دخول</th><th>إجراء</th></tr></thead><tbody>
   {users.map(u=><tr key={u.id}>
    <td><input defaultValue={u.displayName} onBlur={e=>patch(u.id,{displayName:e.target.value})}/></td>
    <td dir="ltr">{u.email}</td>
    <td><select value={u.role} onChange={e=>patch(u.id,{role:e.target.value})}><option value="admin">مدير</option><option value="editor">محرر محتوى</option><option value="writer">كاتب مقالات</option><option value="reviewer">مراجع / ناشر</option></select></td>
    <td><details><summary>تعديل الصلاحيات</summary><div className="admin-permissions-grid">{permissionOptions.map(([key,label])=><label key={key}><input type="checkbox" checked={u.role==="admin"||u.permissions?.includes(key)} disabled={u.role==="admin"} onChange={e=>patch(u.id,{permissions:Array.from(new Set([...(u.permissions||[]).filter(p=>p!==key),...(e.target.checked?[key]:[])]) )})}/>{label}</label>)}</div></details></td>
    <td>{u.lastSignInAt?new Date(u.lastSignInAt).toLocaleString("ar"):"-"}</td>
    <td><button className="danger" type="button" onClick={()=>remove(u.id)}>حذف</button></td>
   </tr>)}
   {!loading&&!users.length&&<tr><td colSpan={6}>لا يوجد مستخدمون.</td></tr>}
  </tbody></table></div></section>
 </div>;
}