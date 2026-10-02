import { Render, type Data } from "@puckeditor/core";
import { notFound } from "next/navigation";
import { getPuckPage, dataForLocale } from "@/lib/cms/puck";
import { puckConfig } from "@/lib/puck/config";

export async function PublicPuckPage({slug,locale="ar"}:{slug:string;locale?:string}) {
  const page=await getPuckPage(slug);
  if(!page||page.status!=="published") notFound();
  const raw=dataForLocale(page,locale);
  const data=(raw?.content?raw:{content:[],root:{}}) as Data;
  const dir=locale==="ar"?"rtl":"ltr";
  return <main className="puck-public-page" lang={locale} dir={dir}><Render config={puckConfig} data={data}/></main>;
}
