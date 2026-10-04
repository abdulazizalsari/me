import type { CmsContentItem, CmsMediaAsset } from "./types";

export type BlogTaxonomyItem = {
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  enabled?: boolean;
  sortOrder?: number;
};

export type BlogSettings = {
  titleAr: string;
  titleEn: string;
  introAr: string;
  introEn: string;
  seoTitleAr: string;
  seoTitleEn: string;
  metaDescriptionAr: string;
  metaDescriptionEn: string;
  ogImage: string;
  noindex: boolean;
  articlesPerPage: number;
  showExcerpt: boolean;
  showAuthor: boolean;
  showDate: boolean;
  showReadingTime: boolean;
  showShare: boolean;
  showRelated: boolean;
  showToc: boolean;
  showFeatured: boolean;
  showImportant: boolean;
  showCategories: boolean;
  showSearch: boolean;
  importantAutoRotate: boolean;
  importantRotateSeconds: number;
  importantCardsCount: number;
  defaultImageAssetId: string;
  defaultImageUrl: string;
  ctaTitleAr: string;
  ctaTitleEn: string;
  ctaUrl: string;
  categories: BlogTaxonomyItem[];
  tags: BlogTaxonomyItem[];
  sectionOrder: Record<string, number>;
};

export const defaultBlogSettings: BlogSettings = {
  titleAr: "رؤى عملية للأعمال والعالم الرقمي",
  titleEn: "Practical Insights for Business and the Digital World",
  introAr: "مقالات وتحليلات وأفكار عملية في التسويق الرقمي، تطوير الأعمال، التجارة الدولية، الاستراتيجية، والتدريب.",
  introEn: "Practical articles, analysis, and ideas on digital marketing, business development, international trade, strategy, and training.",
  seoTitleAr: "رؤى | عبدالعزيز الصاري",
  seoTitleEn: "Insights | AbdulAziz Al-Sari",
  metaDescriptionAr: "مقالات ورؤى عملية في التسويق الرقمي وتطوير الأعمال والتجارة الدولية.",
  metaDescriptionEn: "Practical insights on digital marketing, business development, and international trade.",
  ogImage: "",
  noindex: false,
  articlesPerPage: 6,
  showExcerpt: true,
  showAuthor: true,
  showDate: true,
  showReadingTime: true,
  showShare: true,
  showRelated: true,
  showToc: true,
  showFeatured: true,
  showImportant: true,
  showCategories: true,
  showSearch: true,
  importantAutoRotate: true,
  importantRotateSeconds: 12,
  importantCardsCount: 12,
  defaultImageAssetId: "",
  defaultImageUrl: "",
  ctaTitleAr: "هل تريد تحويل الفكرة إلى خطة عملية؟",
  ctaTitleEn: "Want to turn the idea into a practical plan?",
  ctaUrl: "/consultation",
  categories: [],
  tags: [],
  sectionOrder: { featured: 10, latest: 20, sidebar: 30 }
};

function bool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}
function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}
function number(value: unknown, fallback: number, min = 1, max = 50) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}
function taxonomy(value: unknown): BlogTaxonomyItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map((item, index) => ({
      slug: text(item.slug),
      nameAr: text(item.nameAr),
      nameEn: text(item.nameEn),
      descriptionAr: text(item.descriptionAr),
      descriptionEn: text(item.descriptionEn),
      enabled: item.enabled !== false,
      sortOrder: number(item.sortOrder, (index + 1) * 10, 0, 10000)
    }))
    .filter((item) => item.slug && (item.nameAr || item.nameEn))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function blogSettingsItem(items: CmsContentItem[]) {
  return items.find((item) => item.type === "blog-settings" && item.slug === "blog-settings")
    ?? items.find((item) => item.type === "blog-settings");
}

export function blogSettingsFromItems(items: CmsContentItem[]): BlogSettings {
  const item = blogSettingsItem(items);
  const meta = item?.meta ?? {};
  return {
    titleAr: text(meta.titleAr, item?.titleAr || defaultBlogSettings.titleAr),
    titleEn: text(meta.titleEn, item?.titleEn || defaultBlogSettings.titleEn),
    introAr: text(meta.introAr, item?.summaryAr || defaultBlogSettings.introAr),
    introEn: text(meta.introEn, item?.summaryEn || defaultBlogSettings.introEn),
    seoTitleAr: text(meta.seoTitleAr, defaultBlogSettings.seoTitleAr),
    seoTitleEn: text(meta.seoTitleEn, defaultBlogSettings.seoTitleEn),
    metaDescriptionAr: text(meta.metaDescriptionAr, defaultBlogSettings.metaDescriptionAr),
    metaDescriptionEn: text(meta.metaDescriptionEn, defaultBlogSettings.metaDescriptionEn),
    ogImage: text(meta.ogImage),
    noindex: bool(meta.noindex, false),
    articlesPerPage: number(meta.articlesPerPage, defaultBlogSettings.articlesPerPage, 1, 30),
    showExcerpt: bool(meta.showExcerpt, true),
    showAuthor: bool(meta.showAuthor, true),
    showDate: bool(meta.showDate, true),
    showReadingTime: bool(meta.showReadingTime, true),
    showShare: bool(meta.showShare, true),
    showRelated: bool(meta.showRelated, true),
    showToc: bool(meta.showToc, true),
    showFeatured: bool(meta.showFeatured, true),
    showImportant: bool(meta.showImportant, true),
    showCategories: bool(meta.showCategories, true),
    showSearch: bool(meta.showSearch, true),
    importantAutoRotate: bool(meta.importantAutoRotate, true),
    importantRotateSeconds: number(meta.importantRotateSeconds, 12, 5, 120),
    importantCardsCount: number(meta.importantCardsCount, 12, 3, 18),
    defaultImageAssetId: text(meta.defaultImageAssetId),
    defaultImageUrl: text(meta.defaultImageUrl),
    ctaTitleAr: text(meta.ctaTitleAr, defaultBlogSettings.ctaTitleAr),
    ctaTitleEn: text(meta.ctaTitleEn, defaultBlogSettings.ctaTitleEn),
    ctaUrl: text(meta.ctaUrl, defaultBlogSettings.ctaUrl),
    categories: taxonomy(meta.categories),
    tags: taxonomy(meta.tags),
    sectionOrder: {
      featured: number((meta.sectionOrder as Record<string, unknown> | undefined)?.featured, 10, 0, 1000),
      latest: number((meta.sectionOrder as Record<string, unknown> | undefined)?.latest, 20, 0, 1000),
      sidebar: number((meta.sectionOrder as Record<string, unknown> | undefined)?.sidebar, 30, 0, 1000)
    }
  };
}

export function taxonomySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\u0600-\u06ff-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function articleTags(item: CmsContentItem) {
  return Array.isArray(item.meta?.tags) ? item.meta.tags.map(String).map((tag) => tag.trim()).filter(Boolean) : [];
}

export function blogDefaultImage(settings: BlogSettings, media: CmsMediaAsset[]) {
  if (!settings.defaultImageAssetId) return "";
  return media.find((asset) => asset.id === settings.defaultImageAssetId)?.url ?? settings.defaultImageUrl ?? "";
}
