import { LocaleShell } from "../../_components/LocaleShell";
import { ServiceDetailPage } from "../../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";
import { listContentByType } from "@/lib/cms/database";
import { services } from "@/data/services";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return [...services.map((service) => service.slug), ...(await listContentByType("service")).map((service) => service.slug)].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const service = (await listContentByType("service")).find((item) => item.slug === slug) ?? services.find((item) => item.slug === slug);
  const title = service && "titleAr" in service ? service.titleAr : service?.title.ar;

  return { ...routeMetadata("services", "ar", `/services/${slug}`), title: title ?? "الخدمات" };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <LocaleShell locale="ar"><ServiceDetailPage locale="ar" slug={slug} /></LocaleShell>;
}
