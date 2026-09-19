export const projectCategories = ["All", "Websites", "Branding", "Marketing", "E-Commerce", "Social Media", "Business"] as const;

export const projectCategoryLabels = {
  en: { All: "All", Websites: "Websites", Branding: "Branding", Marketing: "Marketing", "E-Commerce": "E-Commerce", "Social Media": "Social Media", Business: "Business" },
  ar: { All: "الكل", Websites: "المواقع", Branding: "الهويات", Marketing: "التسويق", "E-Commerce": "المتاجر", "Social Media": "السوشيال ميديا", Business: "الأعمال" }
} as const;

export const projects = [
  {
    slug: "digital-marketing-course",
    title: { en: "Digital Marketing Course", ar: "دورة التسويق الرقمي" },
    client: "Training",
    category: "Marketing",
    year: "2026",
    description: { en: "Learn marketing and create impact through a practical, structured course.", ar: "تعلم التسويق واصنع التأثير عبر برنامج تدريبي عملي ومنهجي." },
    services: ["Digital Marketing", "SEO", "AI"],
    image: "/images/legacy/digital-marketing-course.webp"
  },
  {
    slug: "graphic-design-course",
    title: { en: "Graphic Design Course", ar: "دورة التصميم الجرافيكي" },
    client: "Training",
    category: "Branding",
    year: "2026",
    description: { en: "Learn design as a professional skill from visual fundamentals to real projects.", ar: "تعلم التصميم كمهارة مهنية من الأساسيات البصرية إلى المشاريع الحقيقية." },
    services: ["Photoshop", "Illustrator", "Visual Identity"],
    image: "/images/legacy/graphic-design-course.webp"
  },
  {
    slug: "wordpress-course",
    title: { en: "WordPress Course", ar: "دورة الوردبريس" },
    client: "Training",
    category: "Websites",
    year: "2026",
    description: { en: "Build professional WordPress websites with structure, content, SEO, and practical publishing workflows.", ar: "تعلم بناء مواقع ووردبريس احترافية من الهيكلة والمحتوى إلى تحسين الظهور والنشر العملي." },
    services: ["WordPress", "Websites", "SEO"],
    image: "/images/legacy/wordpress-course.png"
  },
  {
    slug: "private-training",
    title: { en: "Personal Training Designed for You", ar: "تدريب شخصي مصمم خصيصاً لك" },
    client: "Training",
    category: "Business",
    year: "2026",
    description: { en: "One-to-one sessions for marketing strategy, SEO, B2B, export, and AI tools.", ar: "جلسات تدريب فردية لتطوير مهاراتك في الاستراتيجيات التسويقية، SEO، تسويق B2B، التصدير، وأدوات الذكاء الاصطناعي." },
    services: ["Training", "Business", "Marketing"],
    image: "/images/legacy/private-training-banner.png"
  }
];
