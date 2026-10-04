import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "@fontsource-variable/noto-kufi-arabic";
import "./globals.css";
import { siteUrl } from "@/data/site";
import { getContentBySlug } from "@/lib/cms/database";
import TrackingManager from "@/components/integrations/TrackingManager";
import { integrationConfigFromMeta } from "@/lib/integrations";

const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-latin", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "AbdulAziz Al-Sari | Digital Marketing & International Trade", template: "%s | AbdulAziz Al-Sari" },
  description: "The professional website of AbdulAziz Al-Sari for digital marketing, international trade, training, consulting, and digital services.",
  openGraph: { type: "website", siteName: "AbdulAziz Al-Sari", title: "AbdulAziz Al-Sari", description: "Digital Marketing & International Trade" },
  twitter: { card: "summary_large_image" }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const integrationItem = await getContentBySlug("integration", "site-integrations");
  const config = integrationConfigFromMeta(integrationItem?.meta);

  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <head>
        {config.googleSearchConsoleEnabled && config.googleSiteVerification && <meta name="google-site-verification" content={config.googleSiteVerification} />}
        {config.bingEnabled && config.bingVerification && <meta name="msvalidate.01" content={config.bingVerification} />}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { const path = location.pathname; const en = path === "/en" || path.startsWith("/en/"); document.documentElement.lang = en ? "en" : "ar"; document.documentElement.dir = en ? "ltr" : "rtl"; })();`
          }}
        />
      </head>
      <body>
        <TrackingManager config={config} />
        {children}
      </body>
    </html>
  );
}
