import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";
import { listContentByType, listContentItems } from "@/lib/cms/database";
import { listPuckPages } from "@/lib/cms/puck";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages=["","about","cv","services","training","ruaa","contact","consultation","privacy-policy"];
  const [items,courses,services,puckPages]=await Promise.all([
    listContentItems({publishedOnly:true}),
    listContentByType("course",{publishedOnly:true}),
    listContentByType("service",{publishedOnly:true}),
    listPuckPages()
  ]);
  const articles=items.filter(item=>item.type==="article");
  const legacyCourses=["digital-marketing-course","graphic-design-course","wordpress-course","private-training"];
  const courseSlugs=Array.from(new Set([...legacyCourses,...courses.map(c=>c.slug)]));
  const publishedPuck=puckPages.filter(p=>p.status==="published");
  const now=new Date();

  return [
    ...pages.flatMap(page=>[
      {url:`${siteUrl}${page?`/${page}`:""}`,lastModified:now},
      {url:`${siteUrl}/en${page?`/${page}`:""}`,lastModified:now}
    ]),
    {url:`${siteUrl}/tr`,lastModified:now},
    {url:`${siteUrl}/tr/services`,lastModified:now},
    {url:`${siteUrl}/tr/training`,lastModified:now},
    {url:`${siteUrl}/tr/ruaa`,lastModified:now},
    ...courseSlugs.flatMap(slug=>[
      {url:`${siteUrl}/training/${slug}`,lastModified:now},
      {url:`${siteUrl}/en/training/${slug}`,lastModified:now},
      ...(courses.some(c=>c.slug===slug)?[{url:`${siteUrl}/tr/training/${slug}`,lastModified:now}]:[])
    ]),
    ...services.flatMap(service=>[
      {url:`${siteUrl}/services/${service.slug}`,lastModified:new Date(service.updatedAt)},
      {url:`${siteUrl}/en/services/${service.slug}`,lastModified:new Date(service.updatedAt)},
      {url:`${siteUrl}/tr/services/${service.slug}`,lastModified:new Date(service.updatedAt)}
    ]),
    ...articles.flatMap(article=>[
      {url:`${siteUrl}/ruaa/${article.slug}`,lastModified:new Date(article.updatedAt)},
      ...(article.titleEn.trim()&&article.summaryEn.trim()?[{url:`${siteUrl}/en/ruaa/${article.slug}`,lastModified:new Date(article.updatedAt)}]:[]),
      {url:`${siteUrl}/tr/ruaa/${article.slug}`,lastModified:new Date(article.updatedAt)}
    ]),
    ...publishedPuck.flatMap(page=>[
      {url:`${siteUrl}/${page.slug}`,lastModified:new Date(page.updatedAt)},
      {url:`${siteUrl}/en/${page.slug}`,lastModified:new Date(page.updatedAt)},
      {url:`${siteUrl}/tr/${page.slug}`,lastModified:new Date(page.updatedAt)}
    ])
  ];
}
