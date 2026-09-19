import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { listContentItems, saveContentItem } from "@/lib/cms/database";
import type { CmsContentItem, CmsContentSeed, CmsStatus } from "@/lib/cms/types";

type DuplicateStrategy = "skip" | "update" | "copy";
type ImportAction = "preview" | "import";
type ExportFormat = "cms" | "wordpress";

const cmsColumns = [
  "id",
  "external_id",
  "post_id",
  "title",
  "slug",
  "content",
  "excerpt",
  "status",
  "publish_date",
  "category",
  "categories",
  "tags",
  "author",
  "language",
  "seo_title",
  "meta_description",
  "canonical",
  "og_title",
  "og_description",
  "og_image",
  "featured_image_url"
];

const aliases: Record<string, string[]> = {
  externalId: ["external_id", "post_id", "id", "wp_id"],
  title: ["post_title", "title", "name"],
  slug: ["post_name", "slug", "permalink"],
  content: ["post_content", "content", "body", "html"],
  excerpt: ["post_excerpt", "excerpt", "summary", "description"],
  status: ["post_status", "status"],
  publishDate: ["post_date", "publish_date", "date"],
  category: ["category", "categories", "terms"],
  tags: ["tags", "post_tags"],
  author: ["author", "post_author"],
  language: ["language", "locale", "lang"],
  seoTitle: ["seo_title", "meta_title", "yoast_title"],
  metaDescription: ["meta_description", "seo_description", "yoast_metadesc"],
  canonical: ["canonical", "canonical_url"],
  ogTitle: ["og_title"],
  ogDescription: ["og_description"],
  ogImage: ["og_image"],
  featuredImageUrl: ["featured_image", "featured_image_url", "image", "thumbnail"]
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function cell(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function splitList(value: string) {
  return value.split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
}

function normalizeStatus(value: string): CmsStatus {
  const status = value.toLowerCase();
  if (["publish", "published", "منشور"].includes(status)) return "published";
  if (["future", "scheduled", "مجدول"].includes(status)) return "scheduled";
  if (["archived", "trash", "private", "مؤرشف"].includes(status)) return "archived";
  return "draft";
}

function safeSlug(title: string, fallback: string) {
  const source = fallback || title || crypto.randomUUID();
  return source.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || crypto.randomUUID();
}

function parseWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return rawRows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])));
}

function rowToArticle(row: Record<string, unknown>, index: number): CmsContentSeed {
  const language = cell(row, aliases.language).toLowerCase();
  const title = cell(row, aliases.title);
  const slug = safeSlug(title, cell(row, aliases.slug));
  const content = sanitizeHtml(cell(row, aliases.content));
  const excerpt = cell(row, aliases.excerpt);
  const category = cell(row, aliases.category);
  const tags = splitList(cell(row, aliases.tags));
  const externalId = cell(row, aliases.externalId);
  const featuredImageUrl = cell(row, aliases.featuredImageUrl);

  return {
    type: "article",
    slug,
    titleAr: language.startsWith("en") ? "" : title,
    titleEn: language.startsWith("en") ? title : "",
    summaryAr: language.startsWith("en") ? "" : excerpt,
    summaryEn: language.startsWith("en") ? excerpt : "",
    bodyAr: language.startsWith("en") ? "" : content,
    bodyEn: language.startsWith("en") ? content : "",
    category,
    status: normalizeStatus(cell(row, aliases.status)),
    sortOrder: (index + 1) * 10,
    meta: {
      externalId,
      wordpressId: externalId,
      date: cell(row, aliases.publishDate),
      author: cell(row, aliases.author),
      tags,
      featuredImageUrl,
      image: featuredImageUrl,
      seoTitle: cell(row, aliases.seoTitle),
      metaDescription: cell(row, aliases.metaDescription),
      canonicalUrl: cell(row, aliases.canonical),
      ogTitle: cell(row, aliases.ogTitle),
      ogDescription: cell(row, aliases.ogDescription),
      ogImage: cell(row, aliases.ogImage),
      englishStatus: language.startsWith("en") ? "published" : "untranslated"
    }
  };
}

function sanitizeHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function findDuplicate(article: CmsContentSeed, existing: CmsContentItem[]) {
  const externalId = String(article.meta?.externalId ?? "");
  return existing.find((item) => {
    const itemExternal = String(item.meta?.externalId ?? item.meta?.wordpressId ?? "");
    return (externalId && itemExternal && externalId === itemExternal) || item.slug === article.slug || Boolean(article.titleAr && item.titleAr === article.titleAr);
  });
}

function workbookResponse(workbook: XLSX.WorkBook, filename: string) {
  const body = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

async function articlesForExport(format: ExportFormat) {
  return (await listContentItems())
    .filter((item) => item.type === "article")
    .map((item) => format === "wordpress" ? {
      ID: item.meta?.wordpressId ?? item.meta?.externalId ?? item.id,
      post_title: item.titleAr || item.titleEn,
      post_name: item.slug,
      post_content: item.bodyAr || item.bodyEn,
      post_excerpt: item.summaryAr || item.summaryEn,
      post_status: item.status === "published" ? "publish" : item.status,
      post_date: item.meta?.date ?? item.updatedAt,
      categories: item.category,
      tags: Array.isArray(item.meta?.tags) ? item.meta.tags.join(", ") : "",
      featured_image_url: item.meta?.featuredImageUrl ?? item.meta?.image ?? "",
      seo_title: item.meta?.seoTitle ?? "",
      meta_description: item.meta?.metaDescription ?? "",
      canonical: item.meta?.canonicalUrl ?? "",
      language: item.titleEn ? "ar" : "ar"
    } : {
      id: item.id,
      slug: item.slug,
      title_ar: item.titleAr,
      title_en: item.titleEn,
      summary_ar: item.summaryAr,
      summary_en: item.summaryEn,
      body_ar: item.bodyAr,
      body_en: item.bodyEn,
      category: item.category,
      status: item.status,
      sort_order: item.sortOrder,
      seo_title: item.meta?.seoTitle ?? "",
      meta_description: item.meta?.metaDescription ?? "",
      canonical: item.meta?.canonicalUrl ?? "",
      updated_at: item.updatedAt
    });
}

export async function GET(request: Request) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");
  const workbook = XLSX.utils.book_new();

  if (mode === "template") {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([cmsColumns, ["", "", "", "عنوان المقال", "article-slug", "<p>HTML content</p>", "ملخص المقال", "draft", new Date().toISOString().slice(0, 10), "التصنيف", "", "tag1, tag2", "AbdulAziz Alsari", "ar", "", "", "", "", "", "", ""]]), "Articles");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Column", "Description"], ["title", "Article title"], ["slug", "Unique URL slug"], ["content", "HTML content is preserved and unsafe scripts are removed"], ["status", "draft / published / scheduled"], ["duplicate strategy", "Choose skip, update, or copy when importing"]]), "Instructions");
    return workbookResponse(workbook, "articles-import-template.xlsx");
  }

  const format = url.searchParams.get("format") === "wordpress" ? "wordpress" : "cms";
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(await articlesForExport(format)), "Articles");
  return workbookResponse(workbook, format === "wordpress" ? "wordpress-compatible-articles.xlsx" : "cms-articles.xlsx");
}

export async function POST(request: Request) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const action = String(formData.get("action") ?? "preview") as ImportAction;
  const duplicateStrategy = String(formData.get("duplicateStrategy") ?? "skip") as DuplicateStrategy;
  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: "ارفع ملف XLSX أو CSV أولاً." }, { status: 400 });

  const rows = parseWorkbook(await file.arrayBuffer());
  const existing = (await listContentItems()).filter((item) => item.type === "article");
  const articles = rows.map(rowToArticle);
  const preview = articles.map((article, index) => {
    const duplicate = findDuplicate(article, existing);
    const warnings = [];
    if (!article.titleAr && !article.titleEn) warnings.push("Missing title");
    if (!article.slug) warnings.push("Missing slug");
    if (duplicate) warnings.push("Duplicate detected");
    return {
      row: index + 1,
      title: article.titleAr || article.titleEn,
      slug: article.slug,
      status: article.status,
      duplicate: Boolean(duplicate),
      valid: warnings.length === 0 || warnings.every((warning) => warning === "Duplicate detected"),
      warnings
    };
  });

  if (action !== "import") {
    return NextResponse.json({
      ok: true,
      summary: {
        rows: preview.length,
        valid: preview.filter((row) => row.valid).length,
        invalid: preview.filter((row) => !row.valid).length,
        existing: preview.filter((row) => row.duplicate).length,
        new: preview.filter((row) => !row.duplicate).length,
        warnings: preview.reduce((count, row) => count + row.warnings.length, 0)
      },
      preview: preview.slice(0, 12)
    });
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const [index, article] of articles.entries()) {
    const currentArticles = (await listContentItems()).filter((item) => item.type === "article");
    const duplicate = findDuplicate(article, currentArticles);
    if ((!article.titleAr && !article.titleEn) || !article.slug) {
      failed += 1;
      errors.push(`Row ${index + 1}: missing title or slug`);
      continue;
    }
    if (duplicate && duplicateStrategy === "skip") {
      skipped += 1;
      continue;
    }
    try {
      const copySlug = duplicate && duplicateStrategy === "copy" ? `${article.slug}-${Date.now()}` : article.slug;
      const saved = await saveContentItem({
        ...(duplicate && duplicateStrategy === "update" ? { id: duplicate.id, createdAt: duplicate.createdAt } : {}),
        ...article,
        slug: copySlug,
        titleAr: article.titleAr || duplicate?.titleAr || article.titleEn,
        summaryAr: article.summaryAr || duplicate?.summaryAr || article.summaryEn
      });
      if (saved && duplicate && duplicateStrategy === "update") updated += 1;
      else if (saved) imported += 1;
    } catch (error) {
      failed += 1;
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : "Import failed"}`);
    }
  }

  return NextResponse.json({ ok: true, result: { imported, updated, skipped, failed, errors } });
}
