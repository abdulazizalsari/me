export function cmsImage(meta: Record<string, unknown> | undefined, key: string, fallback: string) {
  const base = key.replace(/AssetId$/, "");
  const directUrlKey = key === "imageAssetId" ? "image" : `${key}Url`;
  const url = typeof meta?.[directUrlKey] === "string" && String(meta?.[directUrlKey]).trim()
    ? String(meta?.[directUrlKey])
    : fallback;
  const altArKey = `${base}AltAr`;
  const altEnKey = `${base}AltEn`;
  return {
    url,
    altAr: typeof meta?.[altArKey] === "string" ? String(meta?.[altArKey]) : "",
    altEn: typeof meta?.[altEnKey] === "string" ? String(meta?.[altEnKey]) : ""
  };
}
