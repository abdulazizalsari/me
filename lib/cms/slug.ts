export function normalizeContentSlug(value: string) {
  let source = value.trim();
  try { source = decodeURIComponent(source); } catch { /* keep original */ }
  return source
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^p{Letter}p{Number}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
