import { LocaleShell } from "../../_components/LocaleShell";
import { ContactPage } from "../../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata("contact", "en", "/en/contact");

export default function Page() {
  return <LocaleShell locale="en"><ContactPage locale="en" /></LocaleShell>;
}
