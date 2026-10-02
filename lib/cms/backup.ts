import { supabaseRequest } from "@/lib/supabase-rest";

type Row = Record<string, unknown>;
const tables = [
  "content_items",
  "content_revisions",
  "media_assets",
  "activity_logs",
  "redirects",
  "form_submissions",
  "not_found_hits",
  "admin_profiles",
  "site_languages",
  "translation_keys",
  "translations",
  "puck_pages"
] as const;

export async function exportAdminBackup() {
  const pairs = await Promise.all(tables.map(async (table) => {
    const rows = await supabaseRequest<Row[]>(`/rest/v1/${table}?select=*`);
    return [table, rows] as const;
  }));
  return {
    app: "abdulaziz-cms",
    version: 2,
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(pairs)
  };
}

async function clearTable(table: string, key: string) {
  await supabaseRequest(`/rest/v1/${table}?${key}=not.is.null`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}

async function upsertRows(table: string, rows: unknown[], conflict?: string) {
  if (!rows.length) return;
  const suffix = conflict ? `?on_conflict=${conflict}` : "";
  await supabaseRequest(`/rest/v1/${table}${suffix}`, {
    method: "POST",
    body: rows,
    headers: { Prefer: conflict ? "resolution=merge-duplicates,return=minimal" : "return=minimal" }
  });
}

export async function restoreAdminBackup(backup: any) {
  if (!backup || backup.app !== "abdulaziz-cms" || backup.version !== 2 || !backup.data) {
    throw new Error("ملف النسخة الاحتياطية غير صالح.");
  }
  const data = backup.data as Record<string, unknown[]>;
  // Child tables first to avoid foreign-key conflicts.
  await clearTable("content_revisions", "id");
  await clearTable("translations", "key");
  await clearTable("puck_pages", "id");
  await clearTable("redirects", "id");
  await clearTable("form_submissions", "id");
  await clearTable("not_found_hits", "id");
  await clearTable("activity_logs", "id");
  await clearTable("content_items", "id");

  await upsertRows("site_languages", data.site_languages ?? [], "code");
  await upsertRows("translation_keys", data.translation_keys ?? [], "key");
  await upsertRows("content_items", data.content_items ?? [], "id");
  await upsertRows("content_revisions", data.content_revisions ?? [], "id");
  await upsertRows("translations", data.translations ?? [], "key,language_code");
  await upsertRows("puck_pages", data.puck_pages ?? [], "id");
  await upsertRows("redirects", data.redirects ?? [], "id");
  await upsertRows("form_submissions", data.form_submissions ?? [], "id");
  await upsertRows("not_found_hits", data.not_found_hits ?? [], "id");
  await upsertRows("activity_logs", data.activity_logs ?? [], "id");
  // Do not delete auth users. Restore only profile data for user IDs that still exist.
  await upsertRows("admin_profiles", data.admin_profiles ?? [], "user_id");
  await upsertRows("media_assets", data.media_assets ?? [], "id");
}
