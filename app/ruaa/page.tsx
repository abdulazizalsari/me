import type { Metadata } from "next";
import { LocaleShell } from "../_components/LocaleShell";
import { InsightsPage } from "../_components/StandardPage";
import { listContentItems } from "@/lib/cms/database";
import { blogSettingsFromItems } from "@/lib/cms/blog";
import { siteUrl } from "@/data/site";

export async function generateMetadata(): Promise<Metadata> {
  const items = await listContentItems();
  const settings = blogSettingsFromItems(items);
  const image = settings.ogImage ? (settings.ogImage.startsWith("http") ? settings.ogImage : `${siteUrl}${settings.ogImage.startsWith("/") ? "" : "/"}${settings.ogImage}`) : undefined;
  return {
    title: settings.seoTitleAr,
    description: settings.metaDescriptionAr,
    alternates: { canonical: `${siteUrl}/ruaa` },
    robots: settings.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title: settings.seoTitleAr, description: settings.metaDescriptionAr, url: `${siteUrl}/ruaa`, type: "website", images: image ? [{ url: image }] : undefined }
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <LocaleShell locale="ar"><InsightsPage locale="ar" cmsItems={await listContentItems({ publishedOnly: true })} searchParams={await searchParams} /></LocaleShell>;
}
