import { LocaleShell } from "../../_components/LocaleShell";
import { AboutPage } from "../../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata("about", "en", "/en/about");

export default function Page() {
  return <LocaleShell locale="en"><AboutPage locale="en" /></LocaleShell>;
}
