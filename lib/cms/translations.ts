import type { CmsLanguage } from "./types";
import { supabaseRequest } from "@/lib/supabase-rest";

type Row = Record<string, unknown>;
export type TranslationEntry = { key: string; group: string; ar: string; values: Record<string, string> };

export async function listLanguages() {
  const rows = await supabaseRequest<Row[]>("/rest/v1/site_languages?select=*&order=sort_order.asc,code.asc");
  return rows.map((row) => ({
    code: String(row.code),
    nameAr: String(row.name_ar ?? ""),
    nameNative: String(row.name_native ?? ""),
    direction: String(row.direction ?? "ltr") as "rtl" | "ltr",
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order ?? 0)
  } satisfies CmsLanguage));
}

export async function listTranslationEntries() {
  const [keys, translations] = await Promise.all([
    supabaseRequest<Row[]>("/rest/v1/translation_keys?select=*&order=group_name.asc,key.asc"),
    supabaseRequest<Row[]>("/rest/v1/translations?select=key,language_code,value,updated_at")
  ]);
  const map = new Map<string, Record<string, string>>();
  for (const row of translations) {
    const key = String(row.key);
    const current = map.get(key) ?? {};
    current[String(row.language_code)] = String(row.value ?? "");
    map.set(key, current);
  }
  return keys.map((row) => ({
    key: String(row.key),
    group: String(row.group_name ?? "عام"),
    ar: String(row.source_ar ?? ""),
    values: map.get(String(row.key)) ?? {}
  } satisfies TranslationEntry));
}

export async function saveTranslation(input: { key: string; language: string; value: string; userId: string }) {
  const rows = await supabaseRequest<Row[]>("/rest/v1/translations?on_conflict=key,language_code", {
    method: "POST",
    body: {
      key: input.key,
      language_code: input.language,
      value: input.value,
      updated_by: input.userId,
      updated_at: new Date().toISOString()
    },
    headers: { Prefer: "resolution=merge-duplicates,return=representation" }
  });
  return rows[0] ?? null;
}

export async function upsertLanguage(input: CmsLanguage) {
  const rows = await supabaseRequest<Row[]>("/rest/v1/site_languages?on_conflict=code", {
    method: "POST",
    body: {
      code: input.code,
      name_ar: input.nameAr,
      name_native: input.nameNative,
      direction: input.direction,
      enabled: input.enabled,
      sort_order: input.sortOrder,
      updated_at: new Date().toISOString()
    },
    headers: { Prefer: "resolution=merge-duplicates,return=representation" }
  });
  return rows[0] ?? null;
}

export async function deleteLanguage(code: string) {
  await supabaseRequest(`/rest/v1/site_languages?code=eq.${encodeURIComponent(code)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}

export async function translationMap(language: string) {
  const entries = await listTranslationEntries();
  return Object.fromEntries(entries.map((entry) => [entry.key, language === "ar" ? entry.ar : (entry.values[language] || entry.ar)]));
}
