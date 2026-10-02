import { redirect, notFound } from "next/navigation";
import type { Data } from "@puckeditor/core";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { dataForLocale, getPuckPage } from "@/lib/cms/puck";
import { listLanguages } from "@/lib/cms/translations";
import { PuckEditorClient } from "./PuckEditorClient";

export default async function PuckEditPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{locale?:string}>}) {
  const user=await getCurrentCmsUser(); if(!user) redirect("/admin/login");
  const {id}=await params; const page=await getPuckPage(id); if(!page) notFound();
  const languages=await listLanguages(); const requested=(await searchParams).locale||"ar";
  const locale=languages.some(l=>l.code===requested&&l.enabled)?requested:"ar";
  const raw=dataForLocale(page,locale); const data=(raw?.content?raw:{content:[],root:{}}) as Data;
  return <PuckEditorClient pageId={page.id} initialData={data} currentLocale={locale} languages={languages} pageTitle={page.titleAr}/>;
}
