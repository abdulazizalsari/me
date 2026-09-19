import { LocaleShell } from "../_components/LocaleShell";
import { PrivacyPage } from "../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";
import { listContentItems } from "@/lib/cms/database";

export const metadata = routeMetadata("privacy", "ar", "/privacy-policy");

export default async function Page() {
  return <LocaleShell locale="ar"><PrivacyPage locale="ar" cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>;
}
