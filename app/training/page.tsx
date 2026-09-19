import { LocaleShell } from "../_components/LocaleShell";
import { TrainingPage } from "../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";
import { listContentItems } from "@/lib/cms/database";

export const metadata = routeMetadata("training", "ar", "/training");

export default async function Page() {
  return <LocaleShell locale="ar"><TrainingPage locale="ar" cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>;
}
