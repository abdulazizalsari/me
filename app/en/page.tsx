import { LocaleShell } from "../_components/LocaleShell";
import { HomePage } from "../_components/HomePage";
import { routeMetadata } from "@/lib/metadata";
import { listContentItems } from "@/lib/cms/database";

export const metadata = routeMetadata("home", "en", "/en");

export default async function Page() {
  return <LocaleShell locale="en"><HomePage locale="en" cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>;
}
