import { LocaleShell } from "../../_components/LocaleShell";
import { PrivacyPage } from "../../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata("privacy", "en", "/en/privacy");

export default function Page() {
  return <LocaleShell locale="en"><PrivacyPage locale="en" /></LocaleShell>;
}
