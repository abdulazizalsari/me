import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import Script from "next/script";
import "@fontsource-variable/noto-kufi-arabic";
import "./globals.css";
import { siteUrl } from "@/data/site";
import { getContentBySlug } from "@/lib/cms/database";

const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-latin", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "AbdulAziz Al-Sari | Digital Marketing & International Trade", template: "%s | AbdulAziz Al-Sari" },
  description: "The professional website of AbdulAziz Al-Sari for digital marketing, international trade, training, consulting, and digital services.",
  openGraph: { type: "website", siteName: "AbdulAziz Al-Sari", title: "AbdulAziz Al-Sari", description: "Digital Marketing & International Trade" },
  twitter: { card: "summary_large_image" }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const integrations = (await getContentBySlug("integration", "site-integrations"))?.meta ?? {};
  const googleVerification = String(integrations.googleSiteVerification ?? "").replace(/^google-site-verification=/, "").trim();
  const bingVerification = String(integrations.bingVerification ?? "").trim();
  const ga4MeasurementId = String(integrations.ga4MeasurementId ?? "").trim();
  const gtmContainerId = String(integrations.gtmContainerId ?? "").trim();
  const adsenseClientId = String(integrations.adsenseClientId ?? "").trim();
  const ga4Enabled = integrations.ga4Enabled === true && /^G-[A-Z0-9]+$/.test(ga4MeasurementId);
  const gtmEnabled = integrations.gtmEnabled === true && /^GTM-[A-Z0-9]+$/.test(gtmContainerId);
  const adsenseEnabled = integrations.adsenseEnabled === true && /^ca-pub-\d+$/.test(adsenseClientId);

  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <head>
        {integrations.googleSearchConsoleEnabled === true && googleVerification && <meta name="google-site-verification" content={googleVerification} />}
        {integrations.bingEnabled === true && bingVerification && <meta name="msvalidate.01" content={bingVerification} />}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { const en = location.pathname === "/en" || location.pathname.startsWith("/en/"); document.documentElement.lang = en ? "en" : "ar"; document.documentElement.dir = en ? "ltr" : "rtl"; })();`
          }}
        />
      </head>
      <body>
        {gtmEnabled && <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} /></noscript>}
        {gtmEnabled && <Script id="gtm-loader" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmContainerId}');`}</Script>}
        {ga4Enabled && <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`} strategy="afterInteractive" />}
        {ga4Enabled && <Script id="ga4-loader" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4MeasurementId}');`}</Script>}
        {adsenseEnabled && <Script id="adsense-loader" async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`} crossOrigin="anonymous" strategy="afterInteractive" />}
        {children}
      </body>
    </html>
  );
}
