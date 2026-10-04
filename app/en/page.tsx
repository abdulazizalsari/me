import { LocaleShell } from "../_components/LocaleShell";
import { HomePage } from "../_components/HomePage";
import { routeMetadata } from "@/lib/metadata";
import { listContentItems } from "@/lib/cms/database";
import HomeScreenGuardServer from "@/components/security/HomeScreenGuardServer";

export const metadata = routeMetadata("home", "en", "/en");

export default async function Page() {
  return (
    <HomeScreenGuardServer locale="en" watermark={false}>
      <LocaleShell locale="en"><HomePage locale="en" cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>
    </HomeScreenGuardServer>
  );
}
