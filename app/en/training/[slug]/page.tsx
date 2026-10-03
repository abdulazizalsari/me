import type { Metadata } from "next";
import { LocaleShell } from "../../../_components/LocaleShell";
import { CourseDetailPage } from "../../../_components/StandardPage";
import { getContentBySlug, listContentByType } from "@/lib/cms/database";
import { hasContentTranslation } from "@/lib/cms/content-language";

const legacySlugs = ["digital-marketing-course", "graphic-design-course", "wordpress-course", "private-training"];
type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const courses = (await listContentByType("course", { publishedOnly: true })).filter((course)=>course.meta?.englishStatus==="published"&&hasContentTranslation(course,"en"));
  return Array.from(new Set([...legacySlugs, ...courses.map((course) => course.slug)])).map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getContentBySlug("course", slug);
  if(course && (course.meta?.englishStatus!=="published"||!hasContentTranslation(course,"en"))) return {};
  const title = course?.titleEn || "Course Details";
  const description = course?.summaryEn || undefined;
  return { title, description, alternates: { canonical: `https://abdulazizalsari.net/en/training/${slug}` }, openGraph: { title, description, url: `https://abdulazizalsari.net/en/training/${slug}` } };
}
export default async function Page({ params }: PageProps) { const { slug }=await params; return <LocaleShell locale="en"><CourseDetailPage locale="en" slug={slug}/></LocaleShell>; }
