import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TurkishShell } from "@/components/layout/TurkishShell";
import { getContentBySlug } from "@/lib/cms/database";
import { translationMap } from "@/lib/cms/translations";
import { hasContentTranslation, localizedContent } from "@/lib/cms/content-language";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const [item,map]=await Promise.all([getContentBySlug("article",slug),translationMap("tr")]);
  if(!item||item.status!=="published"||!hasContentTranslation(item,"tr",map))return{};
  const c=localizedContent(item,"tr",map);
  return{title:c.title,description:c.summary,alternates:{canonical:`https://abdulazizalsari.net/tr/ruaa/${slug}`},openGraph:{title:c.title,description:c.summary,type:"article"}};
}
export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const [item,map]=await Promise.all([getContentBySlug("article",slug),translationMap("tr")]);
  if(!item||item.status!=="published"||!hasContentTranslation(item,"tr",map))notFound();
  const c=localizedContent(item,"tr",map);
  return <TurkishShell><main><article className="puck-section"><div className="puck-section-inner">
    <p className="eyebrow">İçgörü</p><h1>{c.title}</h1><p className="lead">{c.summary}</p>
    <div className="article-body">{c.body.split(/\n{2,}/).filter(Boolean).map((p,i)=><p key={i}>{p}</p>)}</div>
  </div></article></main></TurkishShell>;
}
