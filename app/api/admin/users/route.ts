import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { supabaseAdminFetch } from "@/lib/supabase-admin";
import type { CmsRole } from "@/lib/cms/types";

const ROLES: CmsRole[] = ["admin", "assistant", "editor", "writer", "reviewer"];
const PERMISSIONS = ["dashboard_view","articles_create","articles_edit","articles_submit","articles_publish","media_manage","pages_manage","related_projects_manage","requests_manage","seo_manage","languages_manage","settings_manage","users_manage","activity_view"];

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}
function role(value: unknown): CmsRole | null {
  return ROLES.includes(value as CmsRole) ? value as CmsRole : null;
}
function permissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((p): p is string => typeof p === "string" && PERMISSIONS.includes(p)))];
}
async function guard() {
  if (!await getCurrentAdmin()) return errorResponse("هذه العملية للمدير فقط.", 403);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return errorResponse("إعداد الخادم الخاص بإدارة المستخدمين غير مكتمل.", 500);
  return null;
}
async function profile(path = "", init: RequestInit = {}) {
  return supabaseAdminFetch(`/rest/v1/admin_profiles${path}`, init);
}
async function readProfiles() {
  const r = await profile("?select=user_id,role,permissions,email,display_name&limit=1000");
  if (!r.ok) throw new Error(await r.text());
  return new Map((await r.json() as Array<{user_id:string;role:CmsRole;permissions:string[];email?:string;display_name?:string}>).map(p => [p.user_id, p]));
}

export async function GET() {
  const denied = await guard(); if (denied) return denied;
  const r = await supabaseAdminFetch("/auth/v1/admin/users?per_page=1000");
  if (!r.ok) return errorResponse("تعذر تحميل المستخدمين.", r.status);
  const data = await r.json() as {users?: Array<{id:string;email?:string;created_at?:string;last_sign_in_at?:string}>};
  const profiles = await readProfiles();
  const users = (data.users || []).map(u => {
    const p = profiles.get(u.id);
    return {id:u.id,email:u.email || p?.email || "",displayName:p?.display_name || "",role:p?.role || "writer",permissions:p?.permissions || [],createdAt:u.created_at || "",lastSignInAt:u.last_sign_in_at || ""};
  });
  return NextResponse.json({ok:true,users});
}

export async function POST(request: Request) {
  const denied = await guard(); if (denied) return denied;
  const body = await request.json().catch(() => null) as {email?:string;password?:string;displayName?:string;role?:unknown;permissions?:unknown} | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password || "";
  const displayName = body?.displayName?.trim() || "";
  const selectedRole = role(body?.role);
  if (!email || !selectedRole || password.length < 8) return errorResponse("البريد والدور وكلمة المرور مطلوبة، وكلمة المرور يجب أن تكون 8 أحرف على الأقل.");
  const selectedPermissions = selectedRole === "admin" ? PERMISSIONS : permissions(body?.permissions);
  const created = await supabaseAdminFetch("/auth/v1/admin/users", {method:"POST",body:JSON.stringify({email,password,email_confirm:true,user_metadata:{display_name:displayName}})});
  const data = await created.json().catch(() => ({})) as {user?:{id:string};message?:string;msg?:string};
  if (!created.ok || !data.user?.id) return errorResponse(data.message || data.msg || "تعذر إنشاء الحساب.", created.status);
  const saved = await profile("", {method:"POST",headers:{"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:data.user.id,email,display_name:displayName,role:selectedRole,permissions:selectedPermissions})});
  if (!saved.ok) {
    await supabaseAdminFetch(`/auth/v1/admin/users/${data.user.id}`, {method:"DELETE"});
    return errorResponse("تم إنشاء الحساب لكن تعذر حفظ الدور والصلاحيات.", 500);
  }
  return NextResponse.json({ok:true,message:"تم إنشاء الحساب والدور والصلاحيات بنجاح."});
}

export async function PATCH(request: Request) {
  const denied = await guard(); if (denied) return denied;
  const body = await request.json().catch(() => null) as {id?:string;displayName?:string;role?:unknown;permissions?:unknown;password?:string} | null;
  if (!body?.id) return errorResponse("معرف المستخدم مطلوب.");
  if (body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < 8) return errorResponse("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
    const changed = await supabaseAdminFetch(`/auth/v1/admin/users/${body.id}`, {method:"PUT",body:JSON.stringify({password:body.password})});
    if (!changed.ok) return errorResponse("تعذر تغيير كلمة المرور.", changed.status);
  }
  const changes: Record<string, unknown> = {};
  if (typeof body.displayName === "string") changes.display_name = body.displayName.trim();
  const selectedRole = body.role === undefined ? null : role(body.role);
  if (body.role !== undefined && !selectedRole) return errorResponse("الدور غير صالح.");
  if (selectedRole) {
    changes.role = selectedRole;
    changes.permissions = selectedRole === "admin" ? PERMISSIONS : permissions(body.permissions);
  } else if (body.permissions !== undefined) {
    changes.permissions = permissions(body.permissions);
  }
  if (Object.keys(changes).length) {
    const saved = await profile(`?user_id=eq.${encodeURIComponent(body.id)}`, {method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify(changes)});
    if (!saved.ok) return errorResponse("تعذر حفظ الدور والصلاحيات.", saved.status);
  }
  return NextResponse.json({ok:true,message:"تم حفظ التعديلات بنجاح."});
}

export async function DELETE(request: Request) {
  const denied = await guard(); if (denied) return denied;
  const body = await request.json().catch(() => null) as {id?:string} | null;
  if (!body?.id) return errorResponse("معرف المستخدم مطلوب.");
  const current = await getCurrentAdmin();
  if (current?.id === body.id) return errorResponse("لا يمكنك حذف حسابك الحالي.", 400);
  const deleted = await supabaseAdminFetch(`/auth/v1/admin/users/${body.id}`, {method:"DELETE"});
  if (!deleted.ok) return errorResponse("تعذر حذف الحساب.", deleted.status);
  return NextResponse.json({ok:true,message:"تم حذف الحساب بنجاح."});
}
