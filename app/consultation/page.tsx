import { LocaleShell } from "../_components/LocaleShell";
import { ContactPage } from "../_components/StandardPage";
import { routeMetadata } from "@/lib/metadata";
export const metadata = routeMetadata("consultation", "ar", "/consultation");
export default function Page() { return <LocaleShell locale="ar"><ContactPage locale="ar" consultation /></LocaleShell>; }
