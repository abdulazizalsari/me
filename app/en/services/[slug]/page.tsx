import { LocaleShell } from "../../../_components/LocaleShell";
import { ServiceDetailPage } from "../../../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";
import { listContentByType } from "@/lib/cms/database";
import { services } from "@/data/services";

type PageProps = { params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return [...services.map((service) => service.slug), ...(await listContentByType("service")).map((service) => service.slug)].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const service = (await listContentByType("service")).find((item) => item.slug === slug) ?? services.find((item) => item.slug === slug);
  const title = service && "titleEn" in service ? service.titleEn : service?.title.en;

  return { ...routeMetadata("services", "en", `/en/services/${slug}`), title: title ?? "Services" };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <LocaleShell locale="en"><ServiceDetailPage locale="en" slug={slug} /></LocaleShell>;
}
