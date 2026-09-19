import { LocaleShell } from "../../_components/LocaleShell";
import { CourseDetailPage } from "../../_components/StandardPage";

const slugs = ["digital-marketing-course", "graphic-design-course", "wordpress-course", "private-training"];

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  return {
    title: "تفاصيل الدورة | AbdulAziz Al-Sari",
    alternates: { canonical: `https://abdulazizalsari.net/training/${slug}` }
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return (
    <LocaleShell locale="ar">
      <CourseDetailPage locale="ar" slug={slug} />
    </LocaleShell>
  );
}

