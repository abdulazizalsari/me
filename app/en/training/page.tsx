import { LocaleShell } from "../../_components/LocaleShell";
import { TrainingPage } from "../../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";
import { listContentItems } from "@/lib/cms/database";

export const metadata = routeMetadata("training", "en", "/en/training");

export default async function Page() {
  return <LocaleShell locale="en"><TrainingPage locale="en" cmsItems={await listContentItems({ publishedOnly: true })} /></LocaleShell>;
}
