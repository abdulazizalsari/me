import { LocaleShell } from "../../_components/LocaleShell";
import { PrivacyPage } from "../../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";
import { listContentItems } from "@/lib/cms/database";

export const metadata = routeMetadata("privacy", "en", "/en/privacy-policy");

export default async function Page() {
  return <LocaleShell locale="en"><PrivacyPage locale="en" cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>;
}
