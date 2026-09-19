import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";
import { listContentItems } from "@/lib/cms/database";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "about", "cv", "services", "training", "ruaa", "contact", "consultation", "privacy-policy"];
  const courses = ["digital-marketing-course", "graphic-design-course", "wordpress-course", "private-training"];
  const cmsArticles = (await listContentItems({ publishedOnly: true })).filter((item) => item.type === "article");

  return [
    ...pages.flatMap((page) => [
      { url: `${siteUrl}${page ? `/${page}` : ""}`, lastModified: new Date() },
      { url: `${siteUrl}/en${page ? `/${page}` : ""}`, lastModified: new Date() }
    ]),
    ...courses.flatMap((slug) => [
      { url: `${siteUrl}/training/${slug}`, lastModified: new Date() },
      { url: `${siteUrl}/en/training/${slug}`, lastModified: new Date() }
    ]),
    ...cmsArticles.map((article) => ({ url: `${siteUrl}/ruaa/${article.slug}`, lastModified: new Date(article.updatedAt) })),
    ...cmsArticles
      .filter((article) => article.meta?.englishStatus === "published")
      .map((article) => ({ url: `${siteUrl}/en/ruaa/${article.slug}`, lastModified: new Date(article.updatedAt) }))
  ];
}
