import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleShell } from "@/app/_components/LocaleShell";
import { getPuckPage, hasPuckTranslation } from "@/lib/cms/puck";
import { PublicPuckPage } from "@/components/puck/PublicPuckPage";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const page=await getPuckPage(slug);
  if(!page||page.status!=="published"||!hasPuckTranslation(page,"en"))return{};
  return{
    title:page.titleEn||slug,
    description:String(page.seo?.descriptionEn||"")||undefined,
    alternates:{canonical:`https://abdulazizalsari.net/en/${slug}`}
  };
}
export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const page=await getPuckPage(slug);
  if(!page||page.status!=="published"||!hasPuckTranslation(page,"en"))notFound();
  return <LocaleShell locale="en"><PublicPuckPage slug={slug} locale="en"/></LocaleShell>;
}
