import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TurkishShell } from "@/components/layout/TurkishShell";
import { getPuckPage, hasPuckTranslation } from "@/lib/cms/puck";
import { PublicPuckPage } from "@/components/puck/PublicPuckPage";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const page=await getPuckPage(slug);
  if(!page||page.status!=="published"||!hasPuckTranslation(page,"tr"))return{};
  return{
    title:String(page.seo?.titleTr||"")||slug,
    description:String(page.seo?.descriptionTr||"")||undefined,
    alternates:{canonical:`https://abdulazizalsari.net/tr/${slug}`}
  };
}
export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const page=await getPuckPage(slug);
  if(!page||page.status!=="published"||!hasPuckTranslation(page,"tr"))notFound();
  return <TurkishShell><PublicPuckPage slug={slug} locale="tr"/></TurkishShell>;
}
