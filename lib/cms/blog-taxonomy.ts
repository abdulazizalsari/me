import type { CmsContentItem } from "./types";
import { blogSettingsFromItems, taxonomySlug } from "./blog";

export function resolveBlogCategory(items: CmsContentItem[], slug: string) {
  const decoded = decodeURIComponent(slug);
  const settings = blogSettingsFromItems(items);
  const configured = settings.categories.find((item) => item.enabled !== false && item.slug === decoded);
  if (configured) return {
    filterValue: configured.nameAr || configured.nameEn,
    nameAr: configured.nameAr || configured.nameEn,
    nameEn: configured.nameEn || configured.nameAr,
    descriptionAr: configured.descriptionAr || "",
    descriptionEn: configured.descriptionEn || ""
  };

  const category = items
    .filter((item) => item.type === "article")
    .map((item) => item.category)
    .filter((value): value is string => typeof value === "string" && Boolean(value))
    .find((value) => taxonomySlug(value) === decoded);
  return category ? { filterValue: category, nameAr: category, nameEn: category, descriptionAr: "", descriptionEn: "" } : null;
}

export function resolveBlogTag(items: CmsContentItem[], slug: string) {
  const decoded = decodeURIComponent(slug);
  const settings = blogSettingsFromItems(items);
  const configured = settings.tags.find((item) => item.enabled !== false && item.slug === decoded);
  if (configured) return {
    filterValue: configured.nameAr || configured.nameEn,
    nameAr: configured.nameAr || configured.nameEn,
    nameEn: configured.nameEn || configured.nameAr,
    descriptionAr: configured.descriptionAr || "",
    descriptionEn: configured.descriptionEn || ""
  };

  const tags = items
    .filter((item) => item.type === "article" && Array.isArray(item.meta?.tags))
    .flatMap((item) => (item.meta?.tags as unknown[]).map(String));
  const tag = tags.find((value) => taxonomySlug(value) === decoded);
  return tag ? { filterValue: tag, nameAr: tag, nameEn: tag, descriptionAr: "", descriptionEn: "" } : null;
}
