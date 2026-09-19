import { LocaleShell } from "../_components/LocaleShell";
import { ServicesPage } from "../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";
import { listContentItems } from "@/lib/cms/database";
export const metadata = routeMetadata("services", "ar", "/services");
export default async function Page() { return <LocaleShell locale="ar"><ServicesPage locale="ar" cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>; }
