import type { Metadata } from "next";
import Link from "next/link";
import { TurkishShell } from "@/components/layout/TurkishShell";
import { listContentByType } from "@/lib/cms/database";
import { translationMap } from "@/lib/cms/translations";
import { hasContentTranslation, localizedContent } from "@/lib/cms/content-language";

export const metadata:Metadata={title:"Eğitimler",alternates:{canonical:"https://abdulazizalsari.net/tr/training"}};

export default async function Page(){
  const [source,map]=await Promise.all([listContentByType("course",{publishedOnly:true}),translationMap("tr")]);
  const items=source.filter(item=>hasContentTranslation(item,"tr",map));
  return <TurkishShell><main><section className="puck-section"><div className="puck-section-inner">
    <p className="eyebrow">Eğitim</p><h1>Uygulamalı eğitim programları</h1>
    <div className="puck-card-grid">{items.map(item=>{const c=localizedContent(item,"tr",map);return <Link className="puck-card" href={`/tr/training/${item.slug}`} key={item.id}><h2 className="h3">{c.title}</h2><p>{c.summary}</p></Link>;})}</div>
    {!items.length&&<p className="muted">Henüz Türkçe çevirisi tamamlanmış eğitim bulunmuyor.</p>}
  </div></section></main></TurkishShell>;
}
