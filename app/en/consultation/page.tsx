import { LocaleShell } from "../../_components/LocaleShell";
import { ContactPage } from "../../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata("consultation", "en", "/en/consultation");

export default function Page() {
  return <LocaleShell locale="en"><ContactPage locale="en" consultation /></LocaleShell>;
}
