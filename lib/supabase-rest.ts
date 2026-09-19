import { cookies } from "next/headers";
import { SUPABASE_ACCESS_COOKIE, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase-config";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function currentAccessToken() {
  try {
    return (await cookies()).get(SUPABASE_ACCESS_COOKIE)?.value || "";
  } catch {
    return "";
  }
}

export async function supabaseRequest<T = unknown>(path: string, options: {
  method?: Method;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
  allowAnonymous?: boolean;
} = {}): Promise<T> {
  const token = options.token ?? await currentAccessToken();
  const headers: Record<string, string> = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token || SUPABASE_PUBLISHABLE_KEY}`,
    ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    ...(options.headers ?? {})
  };
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store"
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Supabase ${response.status}: ${text || response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function supabaseStorageUpload(path: string, bytes: Uint8Array, contentType: string) {
  const token = await currentAccessToken();
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/cms-media/${encodeURI(path)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token || SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "false",
      "cache-control": "31536000"
    },
    body: new Uint8Array(bytes).buffer,
    cache: "no-store"
  });
  if (!response.ok) throw new Error(await response.text().catch(() => response.statusText));
}

export async function supabaseStorageDelete(path: string) {
  const token = await currentAccessToken();
  await supabaseRequest("/storage/v1/object/cms-media", {
    method: "DELETE",
    token,
    body: { prefixes: [path] }
  });
}

export async function supabaseStorageDownload(path: string) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/public/cms-media/${encodeURI(path)}`, { cache: "force-cache" });
  if (!response.ok) throw new Error(await response.text().catch(() => response.statusText));
  return Buffer.from(await response.arrayBuffer());
}
