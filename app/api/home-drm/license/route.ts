import { NextResponse } from "next/server";
import { getHomeDrmAuthorization, getHomeDrmAuthHeaderName } from "@/lib/security/home-drm-auth";

export const dynamic = "force-dynamic";

function targetFor(system: string | null) {
  if (system === "widevine") return process.env.HOME_DRM_WIDEVINE_LICENSE_URL?.trim() ?? "";
  if (system === "playready") return process.env.HOME_DRM_PLAYREADY_LICENSE_URL?.trim() ?? "";
  if (system === "fairplay") return process.env.HOME_DRM_FAIRPLAY_LICENSE_URL?.trim() ?? "";
  return "";
}

function sameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return origin === new URL(request.url).origin; } catch { return false; }
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) {
    return NextResponse.json({ ok: false, message: "Cross-origin DRM requests are not allowed." }, { status: 403 });
  }

  const system = new URL(request.url).searchParams.get("system");
  const target = targetFor(system);
  if (!target) {
    return NextResponse.json({ ok: false, message: "DRM license server is not configured." }, { status: 503 });
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);

  const authorization = await getHomeDrmAuthorization();
  if (authorization) headers.set(getHomeDrmAuthHeaderName(), authorization);

  const upstream = await fetch(target, {
    method: "POST",
    headers,
    body: await request.arrayBuffer(),
    cache: "no-store",
    redirect: "manual"
  });

  const responseHeaders = new Headers({
    "cache-control": "no-store, max-age=0",
    pragma: "no-cache"
  });
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders
  });
}
