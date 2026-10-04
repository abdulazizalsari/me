import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ACCESS_COOKIE, SUPABASE_PUBLISHABLE_KEY, SUPABASE_REFRESH_COOKIE, SUPABASE_URL } from "@/lib/supabase-config";

function accessNeedsRefresh(token?: string) {
  if (!token) return true;
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return !json.exp || json.exp <= Math.floor(Date.now() / 1000) + 60;
  } catch {
    return true;
  }
}

async function refreshAuth(request: NextRequest) {
  const accessToken = request.cookies.get(SUPABASE_ACCESS_COOKIE)?.value;
  if (!accessNeedsRefresh(accessToken)) return NextResponse.next({ request });
  const refreshToken = request.cookies.get(SUPABASE_REFRESH_COOKIE)?.value;
  if (!refreshToken) return NextResponse.next({ request });
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store"
  }).catch(() => null);
  if (!response?.ok) return NextResponse.next({ request });
  const data = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
  const next = NextResponse.next({ request });
  const secure = process.env.NODE_ENV === "production";
  if (data.access_token) next.cookies.set(SUPABASE_ACCESS_COOKIE, data.access_token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: data.expires_in ?? 3600 });
  if (data.refresh_token) next.cookies.set(SUPABASE_REFRESH_COOKIE, data.refresh_token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60*60*24*30 });
  return next;
}

function isPublicAdminPath(pathname: string) {
  return pathname === "/admin/login" || pathname.startsWith("/admin/forgot-password") || pathname.startsWith("/admin/reset-password");
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/tr" || pathname.startsWith("/tr/")) {
    const url=request.nextUrl.clone(); url.pathname=pathname.replace(/^\/tr/,"")||"/"; url.search=search; return NextResponse.redirect(url,308);
  }
  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    const url=request.nextUrl.clone(); url.pathname=pathname.replace(/^\/ar/,"")||"/"; url.search=search; return NextResponse.redirect(url,308);
  }
  if (pathname === "/privacy" || pathname === "/en/privacy") {
    const url=request.nextUrl.clone(); url.pathname=pathname==="/en/privacy"?"/en/privacy-policy":"/privacy-policy"; return NextResponse.redirect(url,308);
  }
  if (pathname === "/insights" || pathname.startsWith("/insights/")) {
    const url=request.nextUrl.clone(); url.pathname=pathname.replace(/^\/insights/,"/ruaa"); url.search=search; return NextResponse.redirect(url,308);
  }
  if (pathname === "/en/insights" || pathname.startsWith("/en/insights/")) {
    const url=request.nextUrl.clone(); url.pathname=pathname.replace(/^\/en\/insights/,"/en/ruaa"); url.search=search; return NextResponse.redirect(url,308);
  }

  if (pathname.startsWith("/admin") && !isPublicAdminPath(pathname)) {
    const hasAccess = Boolean(request.cookies.get(SUPABASE_ACCESS_COOKIE)?.value);
    const hasRefresh = Boolean(request.cookies.get(SUPABASE_REFRESH_COOKIE)?.value);
    if (!hasAccess && !hasRefresh) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return refreshAuth(request);
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/admin")) return refreshAuth(request);
  return NextResponse.next();
}

export const config = { matcher: ["/tr/:path*","/ar/:path*","/privacy","/en/privacy","/insights/:path*","/en/insights/:path*","/admin/:path*","/dashboard/:path*","/api/admin/:path*"] };
