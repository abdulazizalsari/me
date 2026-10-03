import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleShell } from "../../../_components/LocaleShell";
import { InsightsPage } from "../../../_components/StandardPage";
import { listContentItems } from "@/lib/cms/database";
import { resolveBlogCategory } from "@/lib/cms/blog-taxonomy";
import { siteUrl } from "@/data/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const items = await listContentItems({ publishedOnly: true });
  const category = resolveBlogCategory(items, slug);
  if (!category) return { robots: { index: false, follow: false } };
  return {
    title: `${category.nameAr} | رؤى`,
    description: category.descriptionAr || `مقالات ورؤى ضمن تصنيف ${category.nameAr}`,
    alternates: { canonical: `${siteUrl}/ruaa/category/${slug}` }
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const items = await listContentItems({ publishedOnly: true });
  const category = resolveBlogCategory(items, slug);
  if (!category) notFound();
  return <LocaleShell locale="ar"><InsightsPage locale="ar" cmsItems={items} searchParams={{ category: category.filterValue }} /></LocaleShell>;
}
