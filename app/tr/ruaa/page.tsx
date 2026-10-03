import type { Metadata } from "next";
import Link from "next/link";
import { TurkishShell } from "@/components/layout/TurkishShell";
import { listContentByType } from "@/lib/cms/database";
import { translationMap } from "@/lib/cms/translations";
import { hasContentTranslation, localizedContent } from "@/lib/cms/content-language";

export const metadata:Metadata={title:"İçgörüler",alternates:{canonical:"https://abdulazizalsari.net/tr/ruaa"}};

export default async function Page(){
  const [source,map]=await Promise.all([listContentByType("article",{publishedOnly:true}),translationMap("tr")]);
  const items=source.filter(item=>hasContentTranslation(item,"tr",map));
  return <TurkishShell><main><section className="puck-section"><div className="puck-section-inner">
    <p className="eyebrow">İçgörüler</p><h1>Makaleler ve pratik fikirler</h1>
    <div className="puck-card-grid">{items.map(item=>{const c=localizedContent(item,"tr",map);return <Link className="puck-card" href={`/tr/ruaa/${item.slug}`} key={item.id}><h2 className="h3">{c.title}</h2><p>{c.summary}</p></Link>;})}</div>
    {!items.length&&<p className="muted">Henüz Türkçe çevirisi tamamlanmış içerik bulunmuyor.</p>}
  </div></section></main></TurkishShell>;
}
