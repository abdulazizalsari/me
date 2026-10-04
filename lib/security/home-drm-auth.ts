import "server-only";

type CachedToken = { value: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

export async function getHomeDrmAuthorization() {
  const tokenUrl = process.env.HOME_DRM_TOKEN_URL?.trim();
  const clientId = process.env.HOME_DRM_TOKEN_CLIENT_ID?.trim();
  const clientSecret = process.env.HOME_DRM_TOKEN_CLIENT_SECRET?.trim();

  if (tokenUrl && clientId && clientSecret) {
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt - 30_000 > now) return `Bearer ${cachedToken.value}`;

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    });
    const scope = process.env.HOME_DRM_TOKEN_SCOPE?.trim();
    if (scope) body.set("scope", scope);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body,
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`DRM token endpoint returned ${response.status}`);

    const data = await response.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) throw new Error("DRM token endpoint did not return access_token");

    cachedToken = {
      value: data.access_token,
      expiresAt: now + Math.max(30, Number(data.expires_in) || 300) * 1000
    };
    return `Bearer ${data.access_token}`;
  }

  return process.env.HOME_DRM_LICENSE_AUTH_VALUE?.trim() ?? "";
}

export function getHomeDrmAuthHeaderName() {
  return process.env.HOME_DRM_LICENSE_AUTH_HEADER?.trim() || "authorization";
}
