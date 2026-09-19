import { LocaleShell } from "./_components/LocaleShell";
import { HomePage } from "./_components/HomePage";
import { routeMetadata } from "@/lib/metadata";
import { listContentItems } from "@/lib/cms/database";

export const metadata = routeMetadata("home", "ar", "/");

export default async function Page() {
  return <LocaleShell locale="ar"><HomePage locale="ar" cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>;
}
