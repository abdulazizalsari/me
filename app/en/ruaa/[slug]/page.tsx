import type { Metadata } from "next";
import { LocaleShell } from "../../../_components/LocaleShell";
import { ArticlePage } from "../../../_components/StandardPage";
import { getContentBySlug, listContentItems } from "@/lib/cms/database";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params; const article=await getContentBySlug("article",slug);
  const title=article?.titleEn||article?.titleAr||"Insights"; const description=article?.summaryEn||article?.summaryAr||undefined;
  return {title,description,alternates:{canonical:`https://abdulazizalsari.net/en/ruaa/${slug}`},openGraph:{title,description,url:`https://abdulazizalsari.net/en/ruaa/${slug}`,type:"article"}};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LocaleShell locale="en"><ArticlePage locale="en" slug={slug} cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>;
}
