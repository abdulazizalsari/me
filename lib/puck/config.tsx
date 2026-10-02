import type { Config } from "@puckeditor/core";
import { PuckContactForm } from "@/components/puck/PuckContactForm";

type ServiceItem = { title: string; description: string };
type CourseItem = { title: string; description: string; meta: string };
type TestimonialItem = { name: string; role: string; text: string };
type FaqItem = { question: string; answer: string };
type GalleryItem = { url: string; alt: string };

export type PuckComponents = {
  HeadingBlock: { title: string; level: "h1" | "h2" | "h3" };
  TextBlock: { text: string; align: "start" | "center" | "end" };
  HeroBlock: { eyebrow: string; title: string; subtitle: string; buttonLabel: string; buttonHref: string };
  ServicesBlock: { title: string; intro: string; items: ServiceItem[] };
  CoursesBlock: { title: string; intro: string; items: CourseItem[] };
  TestimonialsBlock: { title: string; items: TestimonialItem[] };
  FaqBlock: { title: string; items: FaqItem[] };
  ContactFormBlock: { title: string; intro: string; buttonLabel: string };
  GalleryBlock: { title: string; columns: "2" | "3" | "4"; items: GalleryItem[] };
  CustomCodeBlock: { title: string; html: string; height: number };
};

export const puckConfig: Config<PuckComponents> = {
  categories: {
    basic: { title: "المحتوى الأساسي", components: ["HeadingBlock", "TextBlock"] },
    marketing: { title: "أقسام الصفحة", components: ["HeroBlock", "ServicesBlock", "CoursesBlock", "TestimonialsBlock", "FaqBlock", "ContactFormBlock", "GalleryBlock"] },
    advanced: { title: "متقدم", components: ["CustomCodeBlock"] }
  },
  components: {
    HeadingBlock: {
      label: "عنوان",
      fields: {
        title: { type: "text", label: "نص العنوان" },
        level: { type: "select", label: "مستوى العنوان", options: [
          { label: "عنوان رئيسي H1", value: "h1" }, { label: "عنوان H2", value: "h2" }, { label: "عنوان H3", value: "h3" }
        ] }
      },
      defaultProps: { title: "عنوان جديد", level: "h2" },
      render: ({ title, level }) => { const Tag = level; return <Tag className="puck-site-heading">{title}</Tag>; }
    },
    TextBlock: {
      label: "نص",
      fields: {
        text: { type: "textarea", label: "النص", placeholder: "اكتب النص هنا..." },
        align: { type: "select", label: "المحاذاة", options: [
          { label: "بداية السطر", value: "start" }, { label: "وسط", value: "center" }, { label: "نهاية السطر", value: "end" }
        ] }
      },
      defaultProps: { text: "اكتب محتوى الصفحة هنا.", align: "start" },
      render: ({ text, align }) => <p className="puck-site-text" style={{ textAlign: align }}>{text}</p>
    },
    HeroBlock: {
      label: "هيرو",
      fields: {
        eyebrow: { type: "text", label: "النص الصغير" },
        title: { type: "text", label: "العنوان الرئيسي" },
        subtitle: { type: "textarea", label: "الوصف" },
        buttonLabel: { type: "text", label: "نص الزر" },
        buttonHref: { type: "text", label: "رابط الزر" }
      },
      defaultProps: { eyebrow: "عبدالعزيز الصاري", title: "عنوان صفحة احترافي", subtitle: "اكتب وصفًا مختصرًا وواضحًا للصفحة.", buttonLabel: "تواصل معي", buttonHref: "/contact" },
      render: ({ eyebrow, title, subtitle, buttonLabel, buttonHref }) => <section className="puck-hero"><div className="puck-section-inner"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p><a className="btn btn-primary" href={buttonHref || "#"}>{buttonLabel}</a></div></section>
    },
    ServicesBlock: {
      label: "خدمات",
      fields: {
        title: { type: "text", label: "عنوان القسم" },
        intro: { type: "textarea", label: "مقدمة القسم" },
        items: { type: "array", label: "الخدمات", arrayFields: {
          title: { type: "text", label: "اسم الخدمة" },
          description: { type: "textarea", label: "وصف الخدمة" }
        }, defaultItemProps: { title: "خدمة جديدة", description: "وصف مختصر للخدمة." }, getItemSummary: (item) => item.title }
      },
      defaultProps: { title: "خدماتنا", intro: "حلول عملية مصممة حسب احتياجك.", items: [
        { title: "التسويق الرقمي", description: "استراتيجية وتنفيذ وقياس مستمر." },
        { title: "تطوير المواقع", description: "مواقع سريعة واحترافية ومتجاوبة." },
        { title: "تطوير الأعمال", description: "حلول تساعد المشروع على النمو." }
      ] },
      render: ({ title, intro, items }) => <section className="puck-section"><div className="puck-section-inner"><h2>{title}</h2><p className="puck-intro">{intro}</p><div className="puck-card-grid">{items.map((item, i) => <article className="puck-card" key={i}><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></div></section>
    },
    CoursesBlock: {
      label: "دورات",
      fields: {
        title: { type: "text", label: "عنوان القسم" },
        intro: { type: "textarea", label: "مقدمة القسم" },
        items: { type: "array", label: "الدورات", arrayFields: {
          title: { type: "text", label: "اسم الدورة" },
          description: { type: "textarea", label: "الوصف" },
          meta: { type: "text", label: "المدة / المستوى" }
        }, defaultItemProps: { title: "دورة جديدة", description: "وصف الدورة.", meta: "عملي" }, getItemSummary: (item) => item.title }
      },
      defaultProps: { title: "الدورات", intro: "برامج تدريبية عملية.", items: [
        { title: "التسويق الرقمي", description: "من الأساسيات حتى بناء الحملات.", meta: "عملي" },
        { title: "تصميم المواقع", description: "بناء حضور رقمي احترافي.", meta: "تطبيقي" }
      ] },
      render: ({ title, intro, items }) => <section className="puck-section puck-section-alt"><div className="puck-section-inner"><h2>{title}</h2><p className="puck-intro">{intro}</p><div className="puck-card-grid">{items.map((item, i) => <article className="puck-card" key={i}><span className="puck-meta">{item.meta}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></div></section>
    },
    TestimonialsBlock: {
      label: "شهادات وآراء",
      fields: {
        title: { type: "text", label: "عنوان القسم" },
        items: { type: "array", label: "الشهادات / الآراء", arrayFields: {
          name: { type: "text", label: "الاسم" }, role: { type: "text", label: "الصفة" }, text: { type: "textarea", label: "النص" }
        }, defaultItemProps: { name: "اسم العميل", role: "شركة / مشروع", text: "اكتب نص الشهادة هنا." }, getItemSummary: (item) => item.name }
      },
      defaultProps: { title: "ماذا يقول العملاء", items: [{ name: "عميل", role: "مشروع رقمي", text: "تجربة منظمة واحترافية من التخطيط حتى التنفيذ." }] },
      render: ({ title, items }) => <section className="puck-section"><div className="puck-section-inner"><h2>{title}</h2><div className="puck-card-grid">{items.map((item, i) => <blockquote className="puck-card" key={i}><p>“{item.text}”</p><footer><strong>{item.name}</strong><span>{item.role}</span></footer></blockquote>)}</div></div></section>
    },
    FaqBlock: {
      label: "أسئلة شائعة",
      fields: {
        title: { type: "text", label: "عنوان القسم" },
        items: { type: "array", label: "الأسئلة", arrayFields: {
          question: { type: "text", label: "السؤال" }, answer: { type: "textarea", label: "الإجابة" }
        }, defaultItemProps: { question: "سؤال جديد", answer: "الإجابة هنا." }, getItemSummary: (item) => item.question }
      },
      defaultProps: { title: "الأسئلة الشائعة", items: [{ question: "كيف نبدأ؟", answer: "نبدأ بفهم الهدف ثم نحدد الخطوات المناسبة." }] },
      render: ({ title, items }) => <section className="puck-section puck-section-alt"><div className="puck-section-inner"><h2>{title}</h2><div className="puck-faq">{items.map((item, i) => <details key={i}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div></section>
    },
    ContactFormBlock: {
      label: "نموذج تواصل",
      fields: {
        title: { type: "text", label: "العنوان" },
        intro: { type: "textarea", label: "الوصف" },
        buttonLabel: { type: "text", label: "نص زر الإرسال" }
      },
      defaultProps: { title: "تواصل معي", intro: "أرسل تفاصيل طلبك وسأراجعها.", buttonLabel: "إرسال الطلب" },
      render: (props) => <section className="puck-section"><div className="puck-section-inner"><h2>{props.title}</h2><p className="puck-intro">{props.intro}</p><PuckContactForm buttonLabel={props.buttonLabel} /></div></section>
    },
    GalleryBlock: {
      label: "معرض صور",
      fields: {
        title: { type: "text", label: "عنوان المعرض" },
        columns: { type: "select", label: "عدد الأعمدة", options: [{ label: "2", value: "2" }, { label: "3", value: "3" }, { label: "4", value: "4" }] },
        items: { type: "array", label: "الصور", arrayFields: {
          url: { type: "text", label: "رابط الصورة" }, alt: { type: "text", label: "النص البديل ALT" }
        }, defaultItemProps: { url: "/images/brand/abdulaziz-logo-mark.png", alt: "صورة" }, getItemSummary: (item) => item.alt || item.url }
      },
      defaultProps: { title: "معرض الصور", columns: "3", items: [] },
      render: ({ title, columns, items }) => <section className="puck-section"><div className="puck-section-inner"><h2>{title}</h2><div className="puck-gallery" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{items.map((item, i) => <figure key={i}><img src={item.url} alt={item.alt} loading="lazy" /><figcaption>{item.alt}</figcaption></figure>)}</div></div></section>
    },
    CustomCodeBlock: {
      label: "كود مخصص آمن",
      fields: {
        title: { type: "text", label: "اسم الكتلة" },
        html: { type: "textarea", label: "HTML / CSS", placeholder: "<div>...</div>" },
        height: { type: "number", label: "ارتفاع الكتلة بالبكسل", min: 120, max: 1200 }
      },
      defaultProps: { title: "كود مخصص", html: "<div style='padding:24px;text-align:center'>محتوى مخصص</div>", height: 240 },
      render: ({ title, html, height }) => <section className="puck-section"><div className="puck-section-inner"><div className="puck-code-label">{title}</div><iframe title={title || "Custom block"} sandbox="" srcDoc={html} style={{ width: "100%", height: `${Math.max(120, Math.min(1200, height || 240))}px`, border: 0, borderRadius: 12, background: "#fff" }} /></div></section>
    }
  }
};
