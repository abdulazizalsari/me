import { articles } from "@/data/articles";
import { person, siteUrl } from "@/data/site";
import type { Locale } from "@/lib/i18n";

export function JsonLd({ locale }: { locale: Locale }) {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "AbdulAziz Al-Sari",
    url: siteUrl,
    inLanguage: locale
  };

  const professional = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#service`,
    name: "AbdulAziz Al-Sari",
    url: siteUrl,
    email: person.email,
    telephone: person.phoneDisplay,
    areaServed: ["Turkey", "International"],
    serviceType: ["Digital Marketing", "Business Development", "International Trade", "Website Development", "Business Consulting"]
  };

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: person.name,
    url: siteUrl,
    email: person.email,
    telephone: person.phoneDisplay,
    jobTitle: locale === "ar" ? "مستشار ومدرب تسويق رقمي" : "Digital Marketing Consultant and Trainer"
  };

  const articleSchemas = articles.map((article) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title[locale],
    datePublished: article.date,
    author: { "@id": `${siteUrl}/#person` },
    mainEntityOfPage: `${siteUrl}${locale === "en" ? "/en" : ""}/ruaa/${article.slug}`
  }));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([website, professional, personSchema, ...articleSchemas]) }}
    />
  );
}

