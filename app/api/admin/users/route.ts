import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { currentAccessToken } from "@/lib/supabase-rest";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase-config";

async function proxy(request: Request) {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "هذه العملية للمدير فقط." }, { status: 403 });
  const token = await currentAccessToken();
  if (!token) return NextResponse.json({ ok: false, message: "الجلسة منتهية." }, { status: 401 });
  const body = request.method === "GET" ? undefined : await request.text();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-users`, {
    method: request.method,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" })
    },
    body,
    cache: "no-store"
  });
  return new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
