import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { LocaleShell } from "../../_components/LocaleShell";
import { ArticlePage } from "../../_components/StandardPage";
import { getContentBySlug, isContentPublic, listContentItems } from "@/lib/cms/database";
import { articleMetadata } from "@/lib/cms/article-metadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return articleMetadata(await getContentBySlug("article", slug), "ar", slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getContentBySlug("article", slug);
  if (!article || !isContentPublic(article)) notFound();
  if (article.slug !== slug) permanentRedirect(`/ruaa/${encodeURIComponent(article.slug)}`);
  return <LocaleShell locale="ar"><ArticlePage locale="ar" slug={article.slug} cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>;
}
