import type { Metadata } from "next";
import { siteUrl } from "@/data/site";
import type { CmsContentItem } from "./types";
import { isContentPublic } from "./database";

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function absoluteUrl(value: string, fallbackPath: string) {
  if (!value) return `${siteUrl}${fallbackPath}`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

export function articleMetadata(item: CmsContentItem | null, locale: "ar" | "en", slug: string): Metadata {
  if (!item || !isContentPublic(item)) return { robots: { index: false, follow: false } };

  const path = locale === "en" ? `/en/ruaa/${slug}` : `/ruaa/${slug}`;
  const sourceTitle = locale === "en" ? item.titleEn : item.titleAr;
  const sourceDescription = locale === "en" ? item.summaryEn : item.summaryAr;
  const title = text(item.meta?.seoTitle) || sourceTitle || (locale === "ar" ? "رؤى" : "Insights");
  const description = text(item.meta?.metaDescription) || sourceDescription || undefined;
  const canonical = absoluteUrl(text(item.meta?.canonicalUrl), path);
  const ogTitle = text(item.meta?.ogTitle) || title;
  const ogDescription = text(item.meta?.ogDescription) || description;
  const rawImage = text(item.meta?.ogImage) || text(item.meta?.image);
  const image = rawImage ? absoluteUrl(rawImage, rawImage) : undefined;
  const author = text(item.meta?.authorName) || "AbdulAziz Al-Sari";
  const published = text(item.meta?.date) || text(item.meta?.publishAt) || item.createdAt;
  const noindex = Boolean(item.meta?.noindex);

  return {
    title,
    description,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "article",
      url: canonical,
      title: ogTitle,
      description: ogDescription,
      images: image ? [{ url: image }] : undefined,
      publishedTime: published || undefined,
      modifiedTime: item.updatedAt || undefined,
      authors: [author]
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
      images: image ? [image] : undefined
    }
  };
}
