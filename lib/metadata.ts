import type { Metadata } from "next";
import { siteUrl } from "@/data/site";
import type { Locale } from "@/lib/i18n";

const pageMeta = {
  home: {
    en: ["Digital Marketing & International Trade", "Personal website for AbdulAziz Al-Sari: digital marketing, international trade, training, consulting, websites, branding, and SEO."],
    ar: ["التسويق الرقمي والتجارة الدولية", "الموقع الشخصي والمهني لعبدالعزيز الصاري في التسويق الرقمي والتدريب والاستشارات والتجارة الدولية والحلول الرقمية."]
  },
  about: {
    en: ["About AbdulAziz Al-Sari", "Learn about AbdulAziz Al-Sari's professional background in digital marketing, training, strategy, and design."],
    ar: ["من هو عبدالعزيز الصاري", "تعرف على خبرة عبدالعزيز الصاري في التسويق الرقمي والتدريب والاستراتيجية والتصميم."]
  },
  cv: {
    en: ["Professional Profile", "Professional CV and profile for AbdulAziz Al-Sari across digital marketing, business development, training, and international trade."],
    ar: ["السيرة الذاتية", "السيرة المهنية لعبدالعزيز الصاري في التسويق الرقمي وتطوير الأعمال والتدريب والتجارة الدولية."]
  },
  services: {
    en: ["Services", "Digital marketing, business development, international trade, website development, e-commerce, SEO, branding, consulting, and training services."],
    ar: ["الخدمات", "خدمات التسويق الرقمي وتطوير الأعمال والتجارة الدولية وتطوير المواقع والمتاجر والسيو والهوية والاستشارات والتدريب."]
  },
  training: {
    en: ["Training", "Practical digital marketing and graphic design training programs by AbdulAziz Al-Sari."],
    ar: ["التدريب", "برامج تدريبية عملية في التسويق الرقمي والتصميم الجرافيكي مع عبدالعزيز الصاري."]
  },
  portfolio: {
    en: ["Portfolio", "Selected AbdulAziz Al-Sari portfolio work structured for professional case studies across websites, branding, marketing, and social media."],
    ar: ["الأعمال", "نماذج أعمال عبدالعزيز الصاري مع هيكل مهني لدراسات الحالة في المواقع والهوية والتسويق والسوشيال ميديا."]
  },
  insights: {
    en: ["Insights", "Articles and insights about digital marketing, B2B growth, websites, branding, international trade, and entrepreneurship."],
    ar: ["الرؤى", "مقالات ورؤى حول التسويق الرقمي ونمو الأعمال والمواقع والهوية والتجارة الدولية وريادة الأعمال."]
  },
  ruaa: {
    en: ["Insights", "Articles and insights about digital marketing, B2B growth, websites, branding, international trade, and entrepreneurship."],
    ar: ["الرؤى", "مقالات ورؤى حول التسويق الرقمي ونمو الأعمال والمواقع والهوية والتجارة الدولية وريادة الأعمال."]
  },
  contact: {
    en: ["Contact", "Contact me to discuss your project, marketing challenge, or website development need."],
    ar: ["تواصل", "تواصل معي لمناقشة مشروعك أو تحديك التسويقي أو احتياجك لتطوير موقع."]
  },
  consultation: {
    en: ["Book a Consultation", "Book a consultation with me for digital marketing, training, consulting, or website strategy."],
    ar: ["احجز استشارة", "احجز استشارة معي في التسويق الرقمي أو استراتيجية المواقع."]
  },
  privacy: {
    en: ["Privacy Policy", "Privacy policy for the AbdulAziz Al-Sari personal brand website."],
    ar: ["سياسة الخصوصية", "سياسة الخصوصية لموقع عبدالعزيز الصاري الشخصي والمهني."]
  }
} as const;

export function routeMetadata(page: keyof typeof pageMeta, locale: Locale, path: string): Metadata {
  const [title, description] = pageMeta[page][locale];
  const url = `${siteUrl}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} | AbdulAziz Al-Sari`, description, url, locale },
    twitter: { card: "summary_large_image", title: `${title} | AbdulAziz Al-Sari`, description }
  };
}


