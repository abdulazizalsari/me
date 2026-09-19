export function cmsImage(meta: Record<string, unknown> | undefined, key: string, fallback: string) {
  const base = key.replace(/AssetId$/, "");
  const directUrlKey = key === "imageAssetId" ? "image" : `${key}Url`;
  const rawUrl = typeof meta?.[directUrlKey] === "string" && String(meta?.[directUrlKey]).trim()
    ? String(meta?.[directUrlKey])
    : fallback;
  const url = rawUrl.startsWith("/api/media/")
    ? `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}v=protected-3`
    : rawUrl;
  const altArKey = `${base}AltAr`;
  const altEnKey = `${base}AltEn`;
  return {
    url,
    altAr: typeof meta?.[altArKey] === "string" ? String(meta?.[altArKey]) : "",
    altEn: typeof meta?.[altEnKey] === "string" ? String(meta?.[altEnKey]) : ""
  };
}
