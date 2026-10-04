import { headers } from "next/headers";
import HomeScreenGuard from "./HomeScreenGuard";
import { isScreenGuardCrawler } from "@/lib/security/screen-guard-config";

export default async function HomeScreenGuardServer({
  children,
  locale
}: {
  children: React.ReactNode;
  locale: "ar" | "en";
}) {
  const requestHeaders = await headers();
  const isCrawler = isScreenGuardCrawler(requestHeaders.get("user-agent") ?? "");

  return (
    <HomeScreenGuard locale={locale} disabled={isCrawler}>
      {children}
    </HomeScreenGuard>
  );
}
