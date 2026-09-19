import { LocaleShell } from "../../_components/LocaleShell";
import { ServicesPage } from "../../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";
import { listContentItems } from "@/lib/cms/database";

export const metadata = routeMetadata("services", "en", "/en/services");

export default async function Page() {
  return <LocaleShell locale="en"><ServicesPage locale="en" cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>;
}
