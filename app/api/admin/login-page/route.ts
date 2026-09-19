import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/cms/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const user = email && password ? await loginAdmin(email, password) : null;

  const url = new URL(user ? "/dashboard" : "/dashboard/login?error=1", request.url);
  return NextResponse.redirect(url, 303);
}
