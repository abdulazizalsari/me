import type { Locale } from "@/lib/i18n";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://abdulazizalsari.net";

export const person = {
  name: "AbdulAziz Al-Sari",
  arabicName: "عبدالعزيز الصاري",
  phoneDisplay: "+90 541 392 94 36",
  phoneHref: "tel:+905413929436",
  whatsapp: "https://wa.me/905413929436",
  email: "tr@abdulazizalsari.net",
  secondaryEmail: "info@digitaleast.agency",
  location: { en: "Konya, Turkey", ar: "قونية، تركيا" },
  metrics: [
    { value: "+10", label: { en: "Years Experience", ar: "سنوات خبرة" } },
    { value: "+80", label: { en: "Completed Projects", ar: "مشاريع منجزة" } },
    { value: "9", label: { en: "Core Services", ar: "خدمات رئيسية" } }
  ]
};

export const nav = [
  { href: "/", label: { en: "Home", ar: "الرئيسية" } },
  { href: "/about", label: { en: "About", ar: "حول" } },
  { href: "/training", label: { en: "Training", ar: "التدريب" } },
  { href: "/services", label: { en: "Services", ar: "الخدمات" } },
  { href: "/ruaa", label: { en: "Insights", ar: "رؤى" } },
  { href: "/contact", label: { en: "Contact", ar: "اتصل بنا" } }
];

export const copy = {
  en: {
    tagline: "Digital Marketing & International Trade",
    supporting: "Professional digital services, training, marketing, accounting systems, and brand protection.",
    book: "Book a Consultation",
    work: "View My Work",
    contact: "Contact Me"
  },
  ar: {
    tagline: "تسويق رقمي وتجارة دولية",
    supporting: "أقدّم خدمات رقمية شاملة من التصميم والتسويق إلى التدريب وتنظيم الأعمال وحماية العلامات التجارية.",
    book: "احجز استشارة",
    work: "استعرض الأعمال",
    contact: "تواصل معي"
  }
} satisfies Record<Locale, Record<string, string>>;

export const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/abdulazizalsari" },
  { label: "Instagram", href: "https://www.instagram.com/tr.abdulazizalsari/" },
  { label: "X", href: "https://x.com/Trabdulazizsari" },
  { label: "Facebook", href: "https://www.facebook.com/tr.abdulazizalsari/" },
  { label: "TikTok", href: "https://www.tiktok.com/@trabdulazizsari" }
];


