import { LocaleShell } from "../../_components/LocaleShell";
import { ArticlePage } from "../../_components/StandardPage";
import { listContentItems } from "@/lib/cms/database";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LocaleShell locale="ar"><ArticlePage locale="ar" slug={slug} cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>;
}
