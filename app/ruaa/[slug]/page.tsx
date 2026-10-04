import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { LocaleShell } from "../../_components/LocaleShell";
import { ArticlePage } from "../../_components/StandardPage";
import { getContentBySlug, isContentPublic, listContentItems } from "@/lib/cms/database";
import { articleMetadata } from "@/lib/cms/article-metadata";

function decodeRouteSlug(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getContentBySlug("article", slug);
  return articleMetadata(article, "ar", article?.slug ?? decodeRouteSlug(slug));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeRouteSlug(slug);
  const article = await getContentBySlug("article", slug);
  if (!article || !isContentPublic(article)) notFound();
  if (article.slug !== decodedSlug) permanentRedirect(`/ruaa/${encodeURIComponent(article.slug)}`);
  return <LocaleShell locale="ar"><ArticlePage locale="ar" slug={article.slug} cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>;
}
