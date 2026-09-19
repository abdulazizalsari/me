import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppCTA } from "@/components/layout/WhatsAppCTA";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { localeConfig, type Locale } from "@/lib/i18n";
import { JsonLd } from "@/components/seo/JsonLd";
import { DocumentLocale } from "@/components/seo/DocumentLocale";
import { listContentByType } from "@/lib/cms/database";
import { cmsImage } from "@/lib/cms/media";

export async function LocaleShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const navigation = (await listContentByType("navigation", { publishedOnly: true }))[0];
  const logo = cmsImage(navigation?.meta, "headerLogoImageAssetId", "/images/brand/abdulaziz-logo-mark.png");
  return (
    <div lang={locale} dir={localeConfig[locale].dir}>
      <DocumentLocale locale={locale} />
      <Header locale={locale} logoUrl={logo.url} logoAlt={locale === "ar" ? logo.altAr : logo.altEn} />
      <JsonLd locale={locale} />
      <main id="main">{children}</main>
      <Footer locale={locale} />
      <aside aria-label={locale === "ar" ? "تواصل سريع" : "Quick contact"}><WhatsAppCTA /></aside>
      <CustomCursor />
    </div>
  );
}
