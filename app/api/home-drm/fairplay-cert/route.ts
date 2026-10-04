import { NextResponse } from "next/server";
import { getHomeDrmAuthorization, getHomeDrmAuthHeaderName } from "@/lib/security/home-drm-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const target = process.env.HOME_DRM_FAIRPLAY_CERT_URL?.trim();
  if (!target) {
    return NextResponse.json({ ok: false, message: "FairPlay certificate is not configured." }, { status: 503 });
  }

  const headers = new Headers();
  const authorization = await getHomeDrmAuthorization();
  if (authorization) headers.set(getHomeDrmAuthHeaderName(), authorization);

  const upstream = await fetch(target, { headers, cache: "no-store" });
  if (!upstream.ok) {
    return NextResponse.json({ ok: false, message: `Certificate endpoint returned ${upstream.status}` }, { status: 502 });
  }

  return new Response(await upstream.arrayBuffer(), {
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/octet-stream",
      "cache-control": "private, max-age=300"
    }
  });
}
