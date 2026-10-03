import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleShell } from "../../../_components/LocaleShell";
import { ArticlePage } from "../../../_components/StandardPage";
import { getContentBySlug, isContentPublic, listContentItems } from "@/lib/cms/database";
import { articleMetadata } from "@/lib/cms/article-metadata";
import { hasContentTranslation } from "@/lib/cms/content-language";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getContentBySlug("article", slug);
  if (!article || !isContentPublic(article) || article.meta?.englishStatus !== "published" || !hasContentTranslation(article, "en")) {
    return { robots: { index: false, follow: false } };
  }
  return articleMetadata(article, "en", slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getContentBySlug("article", slug);
  if (!article || !isContentPublic(article) || article.meta?.englishStatus !== "published" || !hasContentTranslation(article, "en")) notFound();
  return <LocaleShell locale="en"><ArticlePage locale="en" slug={slug} cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>;
}
