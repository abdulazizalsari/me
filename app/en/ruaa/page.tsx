import { LocaleShell } from "../../_components/LocaleShell";
import { InsightsPage } from "../../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";
import { listContentItems } from "@/lib/cms/database";

export const metadata = routeMetadata("ruaa", "en", "/en/ruaa");

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <LocaleShell locale="en"><InsightsPage locale="en" cmsItems={await listContentItems({ publishedOnly: true })} searchParams={await searchParams} /></LocaleShell>;
}
