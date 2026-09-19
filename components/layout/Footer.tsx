import { ArrowUp, Facebook, Instagram, Mail, MapPin, Music2, Phone, Twitter } from "lucide-react";
import Image from "next/image";
import { copy, nav, person } from "@/data/site";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { services as staticServices } from "@/data/services";
import { listContentByType } from "@/lib/cms/database";
import { cmsImage } from "@/lib/cms/media";

type FooterPreset = "luxury-dark" | "technical" | "simple" | "gradient" | "geometric";

const socialDefaults = {
  instagram: { label: "Instagram", href: "https://www.instagram.com/tr.abdulazizalsari/", icon: Instagram },
  x: { label: "X", href: "https://x.com/Trabdulazizsari", icon: Twitter },
  facebook: { label: "Facebook", href: "https://www.facebook.com/tr.abdulazizalsari/", icon: Facebook },
  tiktok: { label: "TikTok", href: "https://www.tiktok.com/@trabdulazizalsari", icon: Music2 }
};

const footerNav = nav.filter((item) => item.href !== "/portfolio");

function localized(meta: Record<string, unknown> | undefined, key: string, locale: Locale, fallback: string) {
  const value = meta?.[key];
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const text = (value as Record<string, unknown>)[locale];
    return typeof text === "string" && text.trim() ? text : fallback;
  }
  return typeof value === "string" && value.trim() ? value : fallback;
}

function stringList(meta: Record<string, unknown> | undefined, key: string, locale: Locale, fallback: string[]) {
  const value = meta?.[key];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value && typeof value === "object") {
    const localizedValue = (value as Record<string, unknown>)[locale];
    if (Array.isArray(localizedValue)) return localizedValue.map(String).filter(Boolean);
    if (typeof localizedValue === "string") return localizedValue.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  return fallback;
}

function visibleMap(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function Footer({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const footer = (await listContentByType("footer", { publishedOnly: true }))[0];
  const footerMeta = footer?.meta;
  const logo = cmsImage(footerMeta, "logoImageAssetId", "/images/brand/abdulaziz-logo-lockup.png");
  const services = await listContentByType("service", { publishedOnly: true });
  const serviceSlugs = stringList(footerMeta, "serviceSlugs", locale, []);
  const cmsServiceLinks = services
    .filter((service) => !serviceSlugs.length || serviceSlugs.includes(service.slug))
    .slice(0, 5)
    .map((service) => ({ href: `/services/${service.slug}`, label: ar ? service.titleAr : service.titleEn || service.titleAr }));
  const serviceLinks = cmsServiceLinks.length ? cmsServiceLinks : staticServices.slice(0, 5).map((service) => ({ href: `/services/${service.slug}`, label: service.title[locale] }));
  const navVisibility = visibleMap(footerMeta, "navVisibility");
  const socialVisibility = visibleMap(footerMeta, "socialVisibility");
  const preset = String(footerMeta?.visualPreset ?? "luxury-dark") as FooterPreset;
  const showPattern = footerMeta?.patternVisible !== false;
  const privacyHref = String(footerMeta?.privacyHref || "/privacy-policy");
  const phoneDisplay = String(footerMeta?.phoneDisplay || person.phoneDisplay);
  const phoneHref = String(footerMeta?.phoneHref || person.phoneHref);
  const email = String(footerMeta?.email || person.email);
  const location = localized(footerMeta, "location", locale, person.location[locale]);
  const brandDescription = localized(footerMeta, "brandDescription", locale, ar
    ? "أساعد الأفراد والمشاريع على بناء حضور رقمي أقوى، تطوير الأعمال، واستكشاف فرص التجارة والأسواق الدولية."
    : "I help people and businesses build a stronger digital presence, develop operations, and explore international trade opportunities.");

  return (
    <footer className={`site-footer premium-footer footer-preset-${preset}`} aria-label={ar ? "تذييل الموقع" : "Site footer"}>
      <div className="footer-container-wrap">
        <div className="footer-panel">
          {showPattern && <div className="footer-pattern" aria-hidden="true" />}
          <div className="footer-arc" aria-hidden="true" />

          <div className="footer-main-grid">
            <section className="footer-brand-block" aria-label={ar ? "هوية عبدالعزيز الصاري" : "AbdulAziz Al-Sari identity"}>
              <Image
                src={logo.url}
                alt={ar ? logo.altAr || "شعار عبدالعزيز الصاري" : logo.altEn || "AbdulAziz Al-Sari logo"}
                width={898}
                height={871}
                className="premium-footer-logo"
              />
              <p className="footer-brand-kicker">{localized(footerMeta, "brandTagline", locale, copy[locale].tagline)}</p>
              <p>{brandDescription}</p>
            </section>

            <nav className="footer-col" aria-label={ar ? "روابط سريعة" : "Quick links"}>
              <strong>{ar ? "روابط سريعة" : "Quick Links"}</strong>
              {footerNav.filter((item) => navVisibility[item.href] !== false).map((item) => (
                <a key={item.href} href={withLocale(locale, item.href)}>{item.label[locale]}</a>
              ))}
            </nav>

            <nav className="footer-col" aria-label={ar ? "الخدمات" : "Services"}>
              <strong>{ar ? "الخدمات" : "Services"}</strong>
              {serviceLinks.map((service) => <a key={service.href} href={withLocale(locale, service.href)}>{service.label}</a>)}
            </nav>

            <section className="footer-col footer-contact" aria-label={ar ? "تواصل معي" : "Contact me"}>
              <strong>{ar ? "تواصل معي" : "Contact Me"}</strong>
              <a href={phoneHref}><Phone size={17} aria-hidden /><bdi dir="ltr">{phoneDisplay}</bdi></a>
              <a href={`mailto:${email}`}><Mail size={17} aria-hidden /><bdi dir="ltr">{email}</bdi></a>
              <span><MapPin size={17} aria-hidden />{location}</span>
            </section>
          </div>

          <div className="footer-social-row" aria-label={ar ? "روابط التواصل الاجتماعي" : "Social media links"}>
            {Object.entries(socialDefaults).filter(([key]) => socialVisibility[key] !== false).map(([key, social]) => {
              const Icon = social.icon;
              const href = String(footerMeta?.[`${key}Href`] || social.href);
              return (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                  <Icon size={20} aria-hidden />
                </a>
              );
            })}
          </div>

          <div className="footer-bottom">
            <p>© 2026 AbdulAziz Alsari · All rights reserved.</p>
            <div>
              <a href={withLocale(locale, privacyHref)}>{ar ? "سياسة الخصوصية" : "Privacy Policy"}</a>
              <a href="#main"><ArrowUp size={16} aria-hidden />{ar ? "العودة للأعلى" : "Back to top"}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
