import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";
import { listContentByType, listContentItems } from "@/lib/cms/database";
import { listPuckPages, hasPuckTranslation } from "@/lib/cms/puck";
import { translationMap } from "@/lib/cms/translations";
import { hasContentTranslation } from "@/lib/cms/content-language";
import { articleTags, taxonomySlug } from "@/lib/cms/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages=["","about","cv","services","training","ruaa","contact","consultation","privacy-policy"];
  const [items,courses,services,puckPages,trMap]=await Promise.all([
    listContentItems({publishedOnly:true}),
    listContentByType("course",{publishedOnly:true}),
    listContentByType("service",{publishedOnly:true}),
    listPuckPages(),
    translationMap("tr")
  ]);
  const articles=items.filter(item=>item.type==="article"&&!item.meta?.noindex);
  const articleCategories=Array.from(new Set(articles.map(article=>article.category).filter(Boolean)));
  const articleTagsList=Array.from(new Set(articles.flatMap(article=>articleTags(article))));
  const legacyCourses=["digital-marketing-course","graphic-design-course","wordpress-course","private-training"];
  const courseSlugs=Array.from(new Set([...legacyCourses,...courses.map(c=>c.slug)]));
  const publishedPuck=puckPages.filter(p=>p.status==="published");
  const now=new Date();

  const englishReady=(item:typeof items[number])=>item.meta?.englishStatus==="published"&&hasContentTranslation(item,"en");
  const turkishReady=(item:typeof items[number])=>hasContentTranslation(item,"tr",trMap);

  return [
    ...pages.flatMap(page=>[
      {url:`${siteUrl}${page?`/${page}`:""}`,lastModified:now},
      {url:`${siteUrl}/en${page?`/${page}`:""}`,lastModified:now}
    ]),
    {url:`${siteUrl}/tr`,lastModified:now},
    {url:`${siteUrl}/tr/services`,lastModified:now},
    {url:`${siteUrl}/tr/training`,lastModified:now},
    {url:`${siteUrl}/tr/ruaa`,lastModified:now},
    ...courseSlugs.flatMap(slug=>{
      const course=courses.find(c=>c.slug===slug);
      return [
        {url:`${siteUrl}/training/${slug}`,lastModified:now},
        ...((!course||englishReady(course))?[{url:`${siteUrl}/en/training/${slug}`,lastModified:now}]:[]),
        ...(course&&turkishReady(course)?[{url:`${siteUrl}/tr/training/${slug}`,lastModified:new Date(course.updatedAt)}]:[])
      ];
    }),
    ...services.flatMap(service=>[
      {url:`${siteUrl}/services/${service.slug}`,lastModified:new Date(service.updatedAt)},
      ...(englishReady(service)?[{url:`${siteUrl}/en/services/${service.slug}`,lastModified:new Date(service.updatedAt)}]:[]),
      ...(turkishReady(service)?[{url:`${siteUrl}/tr/services/${service.slug}`,lastModified:new Date(service.updatedAt)}]:[])
    ]),
    ...articles.flatMap(article=>[
      {url:`${siteUrl}/ruaa/${article.slug}`,lastModified:new Date(article.updatedAt)},
      ...(englishReady(article)?[{url:`${siteUrl}/en/ruaa/${article.slug}`,lastModified:new Date(article.updatedAt)}]:[]),
      ...(turkishReady(article)?[{url:`${siteUrl}/tr/ruaa/${article.slug}`,lastModified:new Date(article.updatedAt)}]:[])
    ]),
    ...articleCategories.flatMap(category=>[
      {url:`${siteUrl}/ruaa/category/${taxonomySlug(category)}`,lastModified:now},
      {url:`${siteUrl}/en/ruaa/category/${taxonomySlug(category)}`,lastModified:now}
    ]),
    ...articleTagsList.flatMap(tag=>[
      {url:`${siteUrl}/ruaa/tag/${taxonomySlug(tag)}`,lastModified:now},
      {url:`${siteUrl}/en/ruaa/tag/${taxonomySlug(tag)}`,lastModified:now}
    ]),
    ...publishedPuck.flatMap(page=>[
      {url:`${siteUrl}/${page.slug}`,lastModified:new Date(page.updatedAt)},
      ...(hasPuckTranslation(page,"en")?[{url:`${siteUrl}/en/${page.slug}`,lastModified:new Date(page.updatedAt)}]:[]),
      ...(hasPuckTranslation(page,"tr")?[{url:`${siteUrl}/tr/${page.slug}`,lastModified:new Date(page.updatedAt)}]:[])
    ])
  ];
}
