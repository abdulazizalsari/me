import { Render, type Data } from "@puckeditor/core";
import { notFound } from "next/navigation";
import { getPuckPage,dataForLocale } from "@/lib/cms/puck";
import { puckConfig } from "@/lib/puck/config";

export async function PublicPuckPage({slug,locale="ar"}:{slug:string;locale?:string}){
  const page=await getPuckPage(slug);
  if(!page||page.status!=="published")notFound();
  const raw=dataForLocale(page,locale);
  if(!raw || !Array.isArray(raw.content) || raw.content.length===0) notFound();
  return <div className="puck-public-page" lang={locale} dir={locale==="ar"?"rtl":"ltr"}><Render config={puckConfig} data={raw as Data}/></div>;
}
