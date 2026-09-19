import { LocaleShell } from "../../_components/LocaleShell";
import { CvPage } from "../../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata("cv", "en", "/en/cv");

export default function Page() {
  return <LocaleShell locale="en"><CvPage locale="en" /></LocaleShell>;
}
