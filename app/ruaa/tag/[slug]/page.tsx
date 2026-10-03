import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleShell } from "../../../_components/LocaleShell";
import { InsightsPage } from "../../../_components/StandardPage";
import { listContentItems } from "@/lib/cms/database";
import { resolveBlogTag } from "@/lib/cms/blog-taxonomy";
import { siteUrl } from "@/data/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const items = await listContentItems({ publishedOnly: true });
  const tag = resolveBlogTag(items, slug);
  if (!tag) return { robots: { index: false, follow: false } };
  return {
    title: `#${tag.nameAr} | رؤى`,
    description: tag.descriptionAr || `مقالات ومواد مرتبطة بوسم ${tag.nameAr}`,
    alternates: { canonical: `${siteUrl}/ruaa/tag/${slug}` }
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const items = await listContentItems({ publishedOnly: true });
  const tag = resolveBlogTag(items, slug);
  if (!tag) notFound();
  return <LocaleShell locale="ar"><InsightsPage locale="ar" cmsItems={items} searchParams={{ tag: tag.filterValue }} /></LocaleShell>;
}
