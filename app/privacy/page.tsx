import { LocaleShell } from "../_components/LocaleShell";
import { PrivacyPage } from "../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata("privacy", "ar", "/privacy");

export default function Page() {
  return <LocaleShell locale="ar"><PrivacyPage locale="ar" /></LocaleShell>;
}
