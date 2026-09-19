import { cookies } from "next/headers";
import type { CmsUser } from "./types";
import { ADMIN_EMAIL, SUPABASE_ACCESS_COOKIE, SUPABASE_PUBLISHABLE_KEY, SUPABASE_REFRESH_COOKIE, SUPABASE_URL } from "@/lib/supabase-config";
import { supabaseRequest } from "@/lib/supabase-rest";

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id: string; email?: string; created_at?: string };
};

async function setAuthCookies(data: AuthResponse) {
  if (!data.access_token || !data.refresh_token) return;
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";
  store.set(SUPABASE_ACCESS_COOKIE, data.access_token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: data.expires_in ?? 3600 });
  store.set(SUPABASE_REFRESH_COOKIE, data.refresh_token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function loginAdmin(email: string, password: string) {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  });
  if (!response.ok) return null;
  const data = await response.json() as AuthResponse;
  if (!data.access_token || !data.user?.id) return null;
  await setAuthCookies(data);
  return { id: data.user.id, email: data.user.email ?? email, role: "admin", createdAt: data.user.created_at ?? "" } satisfies CmsUser;
}

export async function signupInitialAdmin(email: string, password: string) {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL) throw new Error("هذا البريد غير مسموح له بتهيئة الإدارة.");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({})) as AuthResponse & { msg?: string; message?: string };
  if (!response.ok) throw new Error(payload.msg || payload.message || "تعذر إنشاء حساب المدير.");
  if (payload.access_token && payload.user?.id) {
    await setAuthCookies(payload);
    return { confirmed: true };
  }
  return { confirmed: false };
}

export async function logoutAdmin() {
  const store = await cookies();
  const token = store.get(SUPABASE_ACCESS_COOKIE)?.value;
  if (token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` }, cache: "no-store" }).catch(() => undefined);
  }
  store.delete(SUPABASE_ACCESS_COOKIE);
  store.delete(SUPABASE_REFRESH_COOKIE);
}

export async function getCurrentAdmin() {
  const store = await cookies();
  const token = store.get(SUPABASE_ACCESS_COOKIE)?.value;
  if (!token) return null;
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` }, cache: "no-store"
  });
  if (!userResponse.ok) return null;
  const user = await userResponse.json() as { id: string; email?: string; created_at?: string };
  if (!user.id || user.email?.toLowerCase() !== ADMIN_EMAIL) return null;
  const profiles = await supabaseRequest<Array<{ role: string }>>(`/rest/v1/admin_profiles?select=role&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, { token });
  if (!profiles[0] || profiles[0].role !== "admin") return null;
  return { id: user.id, email: user.email ?? "", role: "admin", createdAt: user.created_at ?? "" } satisfies CmsUser;
}
