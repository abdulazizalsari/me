import { LocaleShell } from "./_components/LocaleShell";
import { HomePage } from "./_components/HomePage";
import { routeMetadata } from "@/lib/metadata";
import { listContentItems } from "@/lib/cms/database";
import HomeScreenGuardServer from "@/components/security/HomeScreenGuardServer";

export const metadata = routeMetadata("home", "ar", "/");

export default async function Page() {
  return (
    <HomeScreenGuardServer locale="ar">
      <LocaleShell locale="ar"><HomePage locale="ar" cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>
    </HomeScreenGuardServer>
  );
}
