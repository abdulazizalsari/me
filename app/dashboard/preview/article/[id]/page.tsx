import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { getContentById, listContentItems } from "@/lib/cms/database";
import { LocaleShell } from "@/app/_components/LocaleShell";
import { ArticlePage } from "@/app/_components/StandardPage";

export const metadata: Metadata = {
  title: "معاينة المقال",
  robots: { index: false, follow: false }
};

export default async function ArticlePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAdmin();
  if (!user) redirect("/dashboard/login");
  const { id } = await params;
  const article = await getContentById(id);
  if (!article || article.type !== "article") notFound();

  const items = await listContentItems();
  const previewItems = [article, ...items.filter((item) => item.id !== article.id)];
  return <LocaleShell locale="ar"><ArticlePage locale="ar" slug={article.slug} cmsItems={previewItems} /></LocaleShell>;
}
