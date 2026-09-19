import { person } from "@/data/site";
import { projectCategoryLabels, projects as staticProjects } from "@/data/projects";
import { services as staticServices } from "@/data/services";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { CmsContentItem } from "@/lib/cms/types";
import { iconForItem } from "@/lib/cms/render";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ContactForm } from "@/components/forms/ContactForm";
import { notFound } from "next/navigation";
import Image from "next/image";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { cmsImage } from "@/lib/cms/media";
import { getContentBySlug, listContentByType } from "@/lib/cms/database";
import { EditorialArticlePage, EditorialInsightsPage } from "@/app/_components/InsightsBlog";

function publicItemsForLocale(items: CmsContentItem[], locale: Locale) {
  if (locale === "ar") return items;
  return items.filter((item) => item.titleEn.trim() && item.summaryEn.trim() && item.meta?.englishStatus === "published");
}

export function PageHero({ eyebrow, title, lead }: { locale: Locale; eyebrow: string; title: string; lead: string }) {
  return <section className="page-hero"><div className="container"><p className="eyebrow">{eyebrow}</p><h1 className="h1">{title}</h1><p className="lead">{lead}</p></div></section>;
}

export function AboutPage({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const education = [
    "ماجستير إدارة الأعمال MBA",
    "دبلوم أخصائي إعداد مدربين من المركز العالمي للمدربين المحترفين",
    "إعداد المدربين TOT من البورد الألماني للاستشارة والتدريب",
    "دورة التخطيط الاستراتيجي المؤسساتي من البورد الألماني للاستشارة والتدريب",
    "دبلومات ودورات في التسويق الإلكتروني والحملات الإعلانية المدفوعة من جهات دولية",
    "دورات متخصصة في التصميم الجرافيكي على برامج أدوبي"
  ];
  const practicalExperience = [
    "مدرب في التسويق الإلكتروني والاستشارات التسويقية للأفراد والمنظمات",
    "أخصائي تسويق لمراكز تدريب دولية عن بعد",
    "استشاري لعدة مراكز دولية تعمل في مجال التدريب والتطوير المهني",
    "استشاري ومسوق لأكاديميات تدريب إلكتروني",
    "العمل على برامج أوفيس",
    "تصميم المواقع الإلكترونية",
    "إعداد وتنفيذ الحملات الإعلانية",
    "التصميم الجرافيكي الإعلاني"
  ];
  const skills = [
    "قدرة عالية على القيادة والتواصل وإدارة فرق العمل عن بعد",
    "خبرة في التدريب الإلكتروني والتخطيط الاستراتيجي للأفراد والشركات",
    "تحليل السوق والبيانات وتحليل المنافسة",
    "تطوير الاستراتيجيات التسويقية وإدارة الحملات الإعلانية",
    "التصميم الجرافيكي على برامج أدوبي",
    "إدارة المشاريع وإدارة الوقت والموارد"
  ];
  const educationEn = [
    "Master of Business Administration (MBA)",
    "Diploma in Trainer Preparation from the Global Center for Professional Trainers",
    "Training of Trainers (TOT) qualification from the German Board for Consultancy and Training",
    "Institutional Strategic Planning course from the German Board for Consultancy and Training",
    "Diplomas and courses in digital marketing and paid advertising campaigns from international institutions",
    "Specialized graphic design courses using Adobe software"
  ];
  const practicalExperienceEn = [
    "Digital marketing trainer and marketing consultant for individuals and organizations",
    "Remote marketing specialist for international training centers",
    "Consultant to international centers working in training and professional development",
    "Consultant and marketer for online training academies",
    "Microsoft Office experience",
    "Website design",
    "Advertising campaign planning and execution",
    "Advertising graphic design"
  ];
  const skillsEn = [
    "Strong leadership, communication, and remote team management skills",
    "Experience in online training and strategic planning for individuals and companies",
    "Market, data, and competitor analysis",
    "Marketing strategy development and advertising campaign management",
    "Graphic design skills using Adobe software",
    "Project, time, and resource management"
  ];
  return <>
    <PageHero locale={locale} eyebrow={ar ? "حول" : "About"} title={ar ? "عبدالعزيز الصاري" : "AbdulAziz Al-Sari"} lead={ar ? "أعمل في التسويق الرقمي والتدريب وتطوير الأعمال، وأساعد الأفراد والشركات على بناء حلول رقمية عملية قابلة للتنفيذ." : "I work in digital marketing, training, and business development, helping people and businesses build practical digital solutions."} />
    <section className="section"><div className="container split"><div><h2 className="h2">{ar ? "تدريب واستشارات مصممة لتطوير مهاراتك وتحقيق أهدافك" : "Training and Consulting Built Around Your Goals"}</h2></div><div><p className="lead">{ar ? "جلسات تدريب فردية مصممة خصيصاً لتطوير مهاراتك وتحقيق أهدافك بثقة واحترافية، مع تركيز على الاستراتيجيات التسويقية، الأداء الرقمي، تحسين محركات البحث، وتطبيق أدوات الذكاء الاصطناعي في الأعمال." : "One-to-one training and consulting sessions focused on marketing strategy, digital performance, SEO, and practical AI tools for business."}</p></div></div></section>
    <>
      <section className="section band">
        <div className="container">
          <SectionHeader eyebrow={ar ? "المؤهلات التعليمية" : "Education and Qualifications"} title={ar ? "تعليم وتدريب مهني مستمر" : "Continuous professional education and training"} />
          <div className="cv-detail-list">{(ar ? education : educationEn).map((item) => <article className="card cv-detail-item" key={item}><span aria-hidden="true">✓</span><p>{item}</p></article>)}</div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeader eyebrow={ar ? "الخبرات العملية" : "Professional Experience"} title={ar ? "خبرة تجمع التدريب والتسويق والتنفيذ" : "Experience across training, marketing, and execution"} />
          <div className="cv-detail-list">{(ar ? practicalExperience : practicalExperienceEn).map((item) => <article className="card cv-detail-item" key={item}><span aria-hidden="true">✓</span><p>{item}</p></article>)}</div>
        </div>
      </section>
      <section className="section band">
        <div className="container">
          <SectionHeader eyebrow={ar ? "المهارات" : "Skills"} title={ar ? "مهارات عملية قابلة للتطبيق" : "Practical, applicable skills"} />
          <div className="cv-detail-list">{(ar ? skills : skillsEn).map((item) => <article className="card cv-detail-item" key={item}><span aria-hidden="true">✓</span><p>{item}</p></article>)}</div>
        </div>
      </section>
      <section className="section">
        <div className="container cv-profile-copy">
          <SectionHeader eyebrow={ar ? "الخبرات الشخصية" : "Professional Background"} title={ar ? "منهجية تجمع الرؤية والتنفيذ" : "A practical approach combining vision and execution"} />
          {(ar ? [
            "بخبرتي الواسعة في مجال التسويق الإلكتروني والتدريب والاستشارات، وبفضل دراستي وحصولي على دبلومات ودورات في هذا المجال، تمكنت من تطوير مهاراتي في التخطيط الاستراتيجي المؤسساتي والعمل على تطوير العمليات التسويقية والإعلانية للمؤسسات والأفراد. كما أنني قادر على التعامل مع أدوات التصميم الجرافيكي وتحويل الأفكار إلى تصاميم جذابة وفعالة.",
            "وفي جميع المواقف العملية، تمكنت من إثبات قدرتي على القيادة والتواصل الفعال وإدارة فرق العمل عن بعد، وذلك بفضل التفاني والتركيز الذي أوليته لتطوير مهاراتي وتحسين أدائي. وأنا ملتزم بتقديم أفضل خدمة للعملاء والمؤسسات التي أعمل معها، من خلال تحليل الاحتياجات وتقديم الحلول المناسبة لتحقيق الأهداف المحددة.",
            "إلى جانب ذلك، لدي خبرة واسعة في تنظيم وإدارة الحملات الإعلانية والتسويقية المدفوعة على منصات التواصل الاجتماعي مثل فيسبوك وإنستجرام ولينكد إن وتويتر وغيرها، وقد قمت بتصميم وتنفيذ حملات ناجحة لعدد من المشاريع والشركات الناشئة.",
            "لدي القدرة على تحليل البيانات وصياغة الاستراتيجيات الفعالة والمناسبة لأهداف المنظمة، بفضل معرفتي العميقة بالتسويق الرقمي والتكنولوجيا المتطورة المستخدمة في هذا المجال.",
            "أنا متحمس لمواصلة العمل مع المنظمات والشركات لتوصيل رسالتها بشكل فعال وتحقيق أهدافها بأفضل السبل الممكنة."
          ] : [
            "With broad experience in digital marketing, training, and consulting, supported by formal study and specialized diplomas, I have developed strong skills in institutional strategic planning and improving marketing and advertising operations for organizations and individuals. I also use graphic design tools to turn ideas into engaging, effective visuals.",
            "In practical settings, I have demonstrated leadership, effective communication, and remote team management through a disciplined focus on continuous improvement. I am committed to delivering strong client and organizational outcomes by understanding needs and providing suitable solutions.",
            "I have extensive experience planning and managing paid advertising and marketing campaigns across Facebook, Instagram, LinkedIn, X, and other social platforms, including successful campaigns for projects and startups.",
            "I can analyze data and develop effective strategies aligned with organizational goals, supported by deep knowledge of digital marketing and the technologies used in the field.",
            "I am motivated to continue working with organizations and companies to communicate their message effectively and achieve their goals in the best possible way."
          ]).map((paragraph) => <p className="lead" key={paragraph}>{paragraph}</p>)}
        </div>
      </section>
    </>
  </>;
}

export async function CvPage({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const profile = (await listContentByType("cv", { publishedOnly: true }))[0];
  const profileImage = cmsImage(profile?.meta, "profileImageAssetId", "");
  const capabilities = ar
    ? ["التسويق الرقمي", "تطوير الأعمال", "التدريب والاستشارات", "التخطيط الاستراتيجي", "تصميم المواقع", "الحملات الإعلانية", "التصميم الجرافيكي", "إدارة المشاريع", "التجارة الدولية"]
    : ["Digital Marketing", "Business Development", "Training and Consulting", "Strategic Planning", "Website Design", "Advertising Campaigns", "Graphic Design", "Project Management", "International Trade"];
  const credentials = ar
    ? [
      ["الملف المهني", "أنا مدرب ومطور أعمال وخبير تسويق رقمي أعمل على بناء حلول عملية للأفراد والمشاريع."],
      ["مجالات عملي", "أعمل في التسويق الرقمي، تطوير الأعمال، التجارة الدولية، التدريب، الاستشارات، وتصميم الحلول الرقمية."],
      ["منهجية عملي", "أبدأ بفهم الهدف، ثم تحليل السوق، وبناء الخطة، والتنفيذ، والقياس، ثم التحسين المستمر."]
    ]
    : [
      ["Professional Profile", "I am a trainer, business developer, and digital marketing specialist focused on practical growth solutions."],
      ["Core Areas", "I work across digital marketing, business development, international trade, training, consulting, and digital solutions."],
      ["Working Method", "I start with goal discovery, then market analysis, planning, execution, measurement, and continuous improvement."]
    ];

  return <>
    <PageHero locale={locale} eyebrow={ar ? "السيرة الذاتية" : "Professional Profile"} title={ar ? "عبدالعزيز الصاري" : "AbdulAziz Al-Sari"} lead={ar ? "أمتلك خبرة عملية تجمع بين التسويق الرقمي، تطوير الأعمال، التدريب، وإدارة المشاريع مع تركيز واضح على النتائج القابلة للقياس." : "My practical profile spans digital marketing, business development, training, and project execution with a focus on measurable results."} />
    <section className="section">
      <div className="container split">
        {profileImage.url && <Image src={profileImage.url} alt={ar ? profileImage.altAr || "الصورة المهنية" : profileImage.altEn || "Professional profile"} width={480} height={480} className="cv-profile-image" />}
        <div>
          <p className="eyebrow">{ar ? "نبذة مهنية" : "Profile"}</p>
          <h2 className="h2">{ar ? "خبرتي العملية في بناء الحضور الرقمي وتطوير المشاريع" : "My Practical Experience in Digital Growth and Business Development"}</h2>
        </div>
        <p className="lead">{ar ? "أمتلك خبرة واسعة في تصميم الاستراتيجيات التسويقية، إدارة الحملات الإعلانية، تحسين الظهور الرقمي، بناء المواقع، تطوير الأعمال، وتقديم التدريب والاستشارات للأفراد والفرق." : "I work across marketing strategy, campaign management, digital visibility, websites, business development, and practical training for individuals and teams."}</p>
      </div>
    </section>
    <section className="section band">
      <div className="container grid credentials-grid">
        {credentials.map(([title, text]) => <article className="card training-card" key={title}><h2 className="h3">{title}</h2><p className="muted">{text}</p></article>)}
      </div>
    </section>
    <section className="section">
      <div className="container">
        <SectionHeader eyebrow={ar ? "المهارات والخبرات" : "Capabilities"} title={ar ? "مجالات خبرتي الأساسية" : "My Core Expertise"} />
        <div className="experience-points">
          {capabilities.map((item) => <span className="experience-chip" key={item}>{item}</span>)}
        </div>
      </div>
    </section>
  </>;
}

function serviceRows(cmsItems: CmsContentItem[]) {
  const rows = cmsItems.filter((item) => item.type === "service");
  return rows.length ? rows.map((item) => ({
    slug: item.slug,
    icon: iconForItem(item),
    title: { ar: item.titleAr, en: item.titleEn },
    description: { ar: item.summaryAr, en: item.summaryEn }
  })) : staticServices;
}

export function ServicesPage({ locale, cmsItems = [] }: { locale: Locale; cmsItems?: CmsContentItem[] }) {
  const ar = locale === "ar";
  const services = serviceRows(publicItemsForLocale(cmsItems, locale));
  const banner = cmsImage(cmsItems.find((item) => item.type === "homepage")?.meta, "servicesBannerImageAssetId", "/images/legacy/services-banner.webp");
  return <>
    <PageHero locale={locale} eyebrow={ar ? "حلول رقمية متكاملة" : "Integrated Digital Solutions"} title={ar ? "نبني علامتك الرقمية بإتقان لا يضاهى" : "Professional Digital Services"} lead={ar ? "خدمات رقمية شاملة من التصميم والتسويق إلى التدريب ونظام المحاسبة وتسجيل العلامات التجارية." : "Comprehensive digital services from design and marketing to training, accounting systems, and trademark support."} />
    <section className="section legacy-banner-section">
      <div className="container">
        <Image className="legacy-wide-banner" src={banner.url} alt={ar ? banner.altAr || "خدمات رقمية احترافية" : banner.altEn || "Professional digital services"} width={1366} height={350} />
      </div>
    </section>
    <section className="section">
      <div className="container">
        <SectionHeader eyebrow={ar ? "خدماتنا" : "Our Services"} title={ar ? "كل ما يحتاجه مشروعك للنجاح" : "Everything Your Project Needs to Succeed"}>
          {ar ? "تسع خدمات متكاملة مصممة خصيصاً لتناسب رؤيتك." : "Nine integrated services tailored to your vision."}
        </SectionHeader>
        <div className="grid service-grid">
          {services.slice(0, 9).map((s) => {
            const Icon = s.icon;
            return <article className="card service-card service-card-dark" key={s.slug}><div className="icon-box"><Icon size={22} /></div><h2 className="h3">{s.title[locale]}</h2><p className="muted">{s.description[locale]}</p><a className="text-link" href={withLocale(locale, `/services/${s.slug}`)}>{ar ? "استكشف الخدمة" : "Explore Service"}</a></article>;
          })}
        </div>
      </div>
    </section>
    <section className="section"><div className="container cta"><div><h2 className="h2">{ar ? "مستعد ترفع مستوى مشروعك؟" : "Ready to Raise Your Project Level?"}</h2><p className="lead">{ar ? "لا تدع منافسيك يتقدمون عليك — تواصل معنا الآن عبر واتساب واحصل على استشارة مجانية." : "Start with a clear consultation and a practical growth path."}</p></div><WhatsAppLink>{ar ? "تواصل عبر واتساب" : "WhatsApp"}</WhatsAppLink></div></section>
  </>;
}

export async function ServiceDetailPage({ locale, slug }: { locale: Locale; slug: string }) {
  const ar = locale === "ar";
  const cmsService = await getContentBySlug("service", slug);
  const fallback = staticServices.find((service) => service.slug === slug);
  if (!fallback && !cmsService) notFound();
  const title = cmsService ? { ar: cmsService.titleAr, en: cmsService.titleEn } : fallback!.title;
  const description = cmsService ? { ar: cmsService.summaryAr, en: cmsService.summaryEn } : fallback!.description;
  const Icon = cmsService ? iconForItem(cmsService) : fallback!.icon;
  const body = cmsService ? { ar: cmsService.bodyAr || cmsService.summaryAr, en: cmsService.bodyEn || cmsService.summaryEn } : {
    ar: `نقدم حلاً عملياً ومتكاملاً في ${title.ar} يبدأ بفهم احتياجك، ثم بناء خطة واضحة وتنفيذها وقياس أثرها وتحسينها باستمرار.`,
    en: `A practical, focused ${title.en} service that starts with your goals, turns them into a clear plan, and improves performance through measurement and iteration.`
  };
  return <>
    <PageHero locale={locale} eyebrow={ar ? "خدمة رقمية" : "Digital Service"} title={title[locale]} lead={description[locale]} />
    <section className="section"><div className="container split service-detail-layout"><div className="service-detail-icon"><Icon size={42} aria-hidden /></div><div><p className="eyebrow">{ar ? "منهجية عملية" : "Practical approach"}</p><h2 className="h2">{ar ? "حل واضح يبدأ من هدفك" : "A clear solution built around your goal"}</h2><p className="lead">{body[locale]}</p><WhatsAppLink>{ar ? "ناقش احتياجك" : "Discuss your needs"}</WhatsAppLink></div></div></section>
    <section className="section band"><div className="container grid service-detail-points">{(ar ? ["فهم الهدف والسياق", "خطة تنفيذ قابلة للقياس", "مراجعة وتحسين مستمر"] : ["Understand the goal and context", "Build a measurable execution plan", "Review and improve continuously"]).map((point) => <article className="card training-card" key={point}><h2 className="h3">{point}</h2></article>)}</div></section>
  </>;
}

function projectRows(cmsItems: CmsContentItem[]) {
  const rows = cmsItems.filter((item) => item.type === "project");
  return rows.length ? rows.map((item) => ({
    slug: item.slug,
    title: { ar: item.titleAr, en: item.titleEn },
    category: ["Websites", "Branding", "Marketing", "E-Commerce", "Social Media", "Business"].includes(item.category ?? "") ? item.category : "Business",
    year: typeof item.meta?.year === "string" ? item.meta.year : item.updatedAt.slice(0, 4),
    description: { ar: item.summaryAr, en: item.summaryEn },
    services: Array.isArray(item.meta?.services) ? item.meta.services.map(String) : [item.category || "Business"],
    image: cmsImage(item.meta, "imageAssetId", typeof item.meta?.image === "string" ? item.meta.image : "").url,
    imageAlt: { ar: cmsImage(item.meta, "imageAssetId", "").altAr, en: cmsImage(item.meta, "imageAssetId", "").altEn }
  })) : staticProjects.map((project) => ({ ...project, image: "image" in project && typeof project.image === "string" ? project.image : "", imageAlt: undefined }));
}

function courseRows(cmsItems: CmsContentItem[]) {
  const courseSlugs = ["digital-marketing-course", "graphic-design-course", "wordpress-course", "private-training"];
  const rows = cmsItems.filter((item) => item.type === "course");
  const sourceRows = rows.length ? rows : cmsItems.filter((item) => item.type === "project" && courseSlugs.includes(item.slug));
  return sourceRows.length ? sourceRows.map((item) => ({
    slug: item.slug,
    title: { ar: item.titleAr, en: item.titleEn },
    category: ["Websites", "Branding", "Marketing", "E-Commerce", "Social Media", "Business"].includes(item.category ?? "") ? item.category : "Business",
    year: typeof item.meta?.year === "string" ? item.meta.year : item.updatedAt.slice(0, 4),
    description: { ar: item.summaryAr, en: item.summaryEn },
    services: Array.isArray(item.meta?.services) ? item.meta.services.map(String) : [item.category || "Training"],
    image: cmsImage(item.meta, "imageAssetId", typeof item.meta?.image === "string" ? item.meta.image : "").url,
    imageAlt: { ar: cmsImage(item.meta, "imageAssetId", "").altAr, en: cmsImage(item.meta, "imageAssetId", "").altEn }
  })) : staticProjects.filter((project) => courseSlugs.includes(project.slug)).map((project) => ({ ...project, image: "image" in project && typeof project.image === "string" ? project.image : "", imageAlt: undefined }));
}

export function PortfolioPage({ locale, cmsItems = [] }: { locale: Locale; cmsItems?: CmsContentItem[] }) {
  const ar = locale === "ar";
  const projects = projectRows(publicItemsForLocale(cmsItems, locale));
  return <>
    <PageHero locale={locale} eyebrow={ar ? "الأعمال" : "Portfolio"} title={ar ? "الدورات الخاصة والأعمال المختارة" : "Private Courses and Selected Work"} lead={ar ? "عرض للأعمال والدورات كما ظهرت في الموقع القديم، مع تقديم أكثر تنظيماً واحترافية." : "A structured view of selected work and course references."} />
    <section className="section"><div className="container grid portfolio-grid">{projects.map((p) => <article className="card project" key={p.slug}><div className="project-media">{p.image ? <Image src={p.image} alt={p.title[locale]} fill sizes="(max-width: 768px) 100vw, 33vw" /> : <span>{p.title[locale].slice(0, 2)}</span>}</div><div className="project-body"><p className="eyebrow">{projectCategoryLabels[locale][p.category as keyof typeof projectCategoryLabels.en]} · {p.year}</p><h2 className="h3">{p.title[locale]}</h2><p className="muted">{p.description[locale]}</p><div className="chip-row">{p.services.map((service) => <span className="chip" key={service}>{service}</span>)}</div><a className="text-link" href={withLocale(locale, "/contact")}>{ar ? "ابدأ النقاش" : "Start Discussion"}</a></div></article>)}</div></section>
  </>;
}

export function InsightsPage({ locale, cmsItems = [], searchParams = {} }: { locale: Locale; cmsItems?: CmsContentItem[]; searchParams?: Record<string, string | string[] | undefined> }) {
  return <EditorialInsightsPage locale={locale} cmsItems={cmsItems} searchParams={searchParams} />;
}

const digitalMarketingModules = [
  ["استراتيجية التسويق الرقمي", "فهم أهداف المشروع وتحويلها إلى خطة تسويقية واضحة وقابلة للتنفيذ."],
  ["دراسة السوق والمنافسين", "تحليل السوق وفهم المنافسة واكتشاف الفرص التي يمكن البناء عليها."],
  ["الجمهور والعميل المثالي", "تحديد الفئات المستهدفة وبناء شخصية العميل وفهم احتياجاته ودوافعه."],
  ["صناعة المحتوى", "بناء محتوى يخدم أهداف المشروع ويجذب الجمهور ويعزز الثقة."],
  ["الإعلانات الرقمية", "فهم أساسيات المنصات والاستهداف والميزانية وتحليل أداء الإعلانات."],
  ["تحسين محركات البحث SEO", "تعلم المبادئ الأساسية لزيادة ظهور المواقع والمحتوى في نتائج البحث."],
  ["الذكاء الاصطناعي في التسويق", "استخدام أدوات AI لتطوير المحتوى والبحث والتحليل وتسريع سير العمل."],
  ["تحليل النتائج", "قراءة البيانات ومؤشرات الأداء وتحويل النتائج إلى قرارات عملية."]
];

const designModules = [
  ["أساسيات التصميم وكيفية توصيل الفكرة بصرياً", "كيف تفهم المطلوب وتحوله إلى فكرة تصميم واضحة؟"],
  ["اختيار الألوان وتنسيقها باحتراف", "كيف تختار ألواناً تخدم الرسالة وتناسب هوية المشروع؟"],
  ["اختيار الخطوط وترتيب النصوص", "كيف تجعل العنوان والنص واضحين وجذابين داخل التصميم؟"],
  ["Adobe Photoshop", "معالجة الصور وصناعة التكوينات الإعلانية."],
  ["Adobe Illustrator", "الرسم المتجهي وبناء العناصر البصرية."],
  ["تصميم الشعار وبناء الهوية البصرية", "من الفكرة الأولى إلى هوية متناسقة يمكن استخدامها في مختلف التصاميم."]
];

const courseDetails = {
  "digital-marketing-course": {
    image: "/images/legacy/digital-marketing-course.webp",
    title: { ar: "دورة احتراف التسويق الرقمي", en: "Digital Marketing Course" },
    intro: {
      ar: "برنامج تدريبي متكامل يساعدك على فهم التسويق الرقمي بصورة منهجية، وتطوير مهارات عملية في دراسة السوق، بناء الاستراتيجيات، صناعة المحتوى، الإعلانات، SEO واستخدام الذكاء الاصطناعي.",
      en: "A practical course for market research, strategy, content, advertising, SEO, and using AI in marketing workflows."
    },
    modules: digitalMarketingModules
  },
  "graphic-design-course": {
    image: "/images/legacy/graphic-design-course.webp",
    title: { ar: "دورة التصميم الجرافيكي", en: "Graphic Design Course" },
    intro: {
      ar: "برنامج تدريبي أكاديمي وتطبيقي ينقلك من فهم مبادئ الاتصال البصري إلى بناء تصاميم احترافية قابلة للاستخدام في الهوية والتسويق والطباعة.",
      en: "A practical design course from visual communication fundamentals to professional brand, marketing, and print design."
    },
    modules: designModules
  },
  "wordpress-course": {
    image: "/images/legacy/wordpress-course.png",
    title: { ar: "دورة الوردبريس", en: "WordPress Course" },
    intro: {
      ar: "برنامج عملي لتعلم بناء مواقع ووردبريس احترافية، من تنظيم الصفحات والمحتوى إلى ضبط الإضافات الأساسية وتحسين الظهور في محركات البحث وتجهيز الموقع للنشر.",
      en: "A practical program for building professional WordPress websites, from pages and content to essential plugins, SEO foundations, and launch-ready publishing."
    },
    modules: [
      ["أساسيات ووردبريس", "فهم لوحة التحكم، الصفحات، المقالات، القوائم، القوالب، وطريقة تنظيم الموقع."],
      ["بناء الصفحات والمحتوى", "تصميم صفحات واضحة وتحويل المحتوى إلى تجربة سهلة للزائر."],
      ["القوالب والإضافات", "اختيار القوالب المناسبة وضبط الإضافات الأساسية بدون تعقيد زائد."],
      ["تحسين محركات البحث SEO", "تهيئة العناوين والوصف والروابط والمحتوى لتحسين ظهور الموقع."],
      ["الأمان والسرعة", "تطبيق إعدادات أساسية لحماية الموقع وتحسين الأداء وتجربة المستخدم."],
      ["النشر والإدارة", "إطلاق الموقع ومتابعة التحديثات والنسخ الاحتياطي وإدارة المحتوى بثقة."]
    ]
  },
  "private-training": {
    image: "/images/legacy/private-training-banner.png",
    title: { ar: "تدريب شخصي مصمم خصيصاً لك", en: "Personal Training Designed for You" },
    intro: {
      ar: "جلسات تدريب فردية مصممة خصيصاً لتطوير مهاراتك وتحقيق أهدافك بثقة واحترافية في التسويق، تطوير الأعمال، SEO، B2B، التصدير، وأدوات الذكاء الاصطناعي.",
      en: "One-to-one training sessions tailored for marketing, business development, SEO, B2B, export, and practical AI tools."
    },
    modules: [
      ["تشخيص الاحتياج", "فهم وضعك الحالي وتحديد أولويات التدريب بدقة."],
      ["خطة تدريب فردية", "تصميم مسار عملي يناسب أهدافك ومجال عملك."],
      ["تطبيق ومراجعة", "تنفيذ خطوات عملية ومراجعة النتائج والتحسينات."]
    ]
  }
} as const;

export function TrainingPage({ locale, cmsItems = [] }: { locale: Locale; cmsItems?: CmsContentItem[] }) {
  const ar = locale === "ar";
  const courseAds = courseRows(publicItemsForLocale(cmsItems, locale)).filter((course) => ["digital-marketing-course", "graphic-design-course", "wordpress-course"].includes(course.slug));
  return <>
    <PageHero locale={locale} eyebrow={ar ? "التدريب" : "Training"} title={ar ? "اختر الدورة المناسبة لك" : "Choose the right course for you"} lead={ar ? "استعرض الدورات، ثم افتح صفحة التفاصيل الخاصة بالدورة التي تهمك." : "Browse the courses, then open the dedicated details page for the one you want."} />
    <section className="section"><div className="container legacy-course-grid">{courseAds.map((course) => <article className="card project" key={course.slug}><div className="project-media"><Image src={course.image} alt={course.title[locale]} fill sizes="(max-width: 768px) 100vw, 33vw" /></div><div className="project-body"><p className="eyebrow">{ar ? "دورة تدريبية" : "Training course"}</p><h2 className="h3">{course.title[locale]}</h2><p className="muted">{course.description[locale]}</p><a className="btn btn-primary" href={withLocale(locale, `/training/${course.slug}`)}>{ar ? "تفاصيل الدورة" : "Course details"}</a></div></article>)}</div></section>
  </>;
}

export async function CourseDetailPage({ locale, slug }: { locale: Locale; slug: string }) {
  const ar = locale === "ar";
  const isDigitalMarketing = slug === "digital-marketing-course";
  const cmsCourse = (await getContentBySlug("course", slug)) ?? (await getContentBySlug("project", slug));
  const fallbackCourse = courseDetails[slug as keyof typeof courseDetails];
  const courseImage = cmsImage(cmsCourse?.meta, "imageAssetId", fallbackCourse?.image ?? "");
  const course = fallbackCourse ? {
    ...fallbackCourse,
    image: courseImage.url,
    title: isDigitalMarketing ? { ar: "دورة احتراف التسويق الرقمي", en: "Digital Marketing Mastery Course" } : cmsCourse ? { ar: cmsCourse.titleAr, en: cmsCourse.titleEn } : fallbackCourse.title,
    intro: isDigitalMarketing ? fallbackCourse.intro : cmsCourse ? { ar: cmsCourse.summaryAr, en: cmsCourse.summaryEn } : fallbackCourse.intro
  } : null;
  if (!course) notFound();
  if (slug === "graphic-design-course") return <GraphicDesignCoursePage locale={locale} image={courseImage.url} />;
  if (slug === "wordpress-course") return <WordPressCoursePage locale={locale} image={courseImage.url} />;
  const tools = ar ? ["تحليل السوق", "إدارة المحتوى", "SEO", "الإعلانات", "الذكاء الاصطناعي", "التصميم"] : ["Market Research", "Content Systems", "SEO", "Advertising", "AI", "Design"];
  const faq = ar
    ? [
      ["هل الدورة عملية؟", "نعم، يتم التركيز على التطبيق العملي وربط المفاهيم بأهداف المتدرب أو المشروع."],
      ["هل أحتاج خبرة مسبقة؟", "ليست مطلوبة في البداية، ويتم ضبط المستوى حسب احتياج المتدرب."],
      ["كيف يتم التسجيل؟", "يمكنك إرسال رسالة عبر واتساب أو نموذج الاستشارة لتحديد المسار المناسب."]
    ]
    : [
      ["Is the course practical?", "Yes. The focus is on applying concepts to real goals and projects."],
      ["Do I need prior experience?", "No. The level can be adjusted to your current needs."],
      ["How do I register?", "Use WhatsApp or the consultation form to define the right path."]
    ];

  return <>
    <section className="page-hero course-hero">
      <div className="container split">
        <div>
          <p className="eyebrow">{ar ? "برنامج تدريبي" : "Training Program"}</p>
          <h1 className="h1">{course.title[locale]}</h1>
          <p className="lead">{course.intro[locale]}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={isDigitalMarketing ? "#registration" : withLocale(locale, "/consultation")}>{ar ? "سجّل في الدورة" : "Register for the course"}</a>
            {isDigitalMarketing && <a className="btn btn-secondary" href="#course-content">{ar ? "استكشف محتوى البرنامج" : "Explore the curriculum"}</a>}
            <WhatsAppLink className="btn btn-secondary">{ar ? "استفسر عبر واتساب" : "Ask on WhatsApp"}</WhatsAppLink>
          </div>
        </div>
        <Image className="course-hero-image" src={course.image} alt={course.title[locale]} width={1600} height={1600} priority />
      </div>
    </section>
    {isDigitalMarketing && <section className="section course-overview">
      <div className="container split">
        <div>
          <p className="eyebrow">{ar ? "تعليم منهجي وتطبيق عملي" : "Structured learning and practical application"}</p>
          <h2 className="h2">{ar ? "تعلّم التسويق بمنهجية واضحة، وليس بمجرد معلومات متفرقة" : "Learn marketing through a clear system, not disconnected information"}</h2>
        </div>
        <div className="article-body">
          <p>{ar ? "تم تصميم البرنامج ليمنحك أساساً متكاملاً يساعدك على فهم السوق واتخاذ قرارات تسويقية أكثر احترافية." : "This program gives you a complete foundation for understanding the market and making more professional marketing decisions."}</p>
          <p>{ar ? "لم يعد التسويق الرقمي مجرد نشر محتوى على وسائل التواصل الاجتماعي أو تشغيل إعلان ممول، بل أصبح منظومة متكاملة تبدأ من فهم السوق والجمهور، مروراً ببناء العرض والرسالة التسويقية واختيار القنوات المناسبة، وصولاً إلى تحليل النتائج وتحسين الأداء." : "Digital marketing is more than posting on social media or running a paid ad. It is an integrated system covering market and audience understanding, offers, messaging, channel selection, measurement, and performance improvement."}</p>
          <p>{ar ? "في هذه الدورة ستتعلم كيف تنظر إلى التسويق بعقلية استراتيجية، وكيف تحول أهداف أي مشروع إلى خطة قابلة للتنفيذ والقياس، مع الاستفادة من الأدوات الرقمية الحديثة والذكاء الاصطناعي لتطوير الإنتاجية وتحسين جودة القرارات." : "You will learn to approach marketing strategically, turn project goals into measurable plans, and use modern digital tools and AI to improve productivity and decisions."}</p>
          <p>{ar ? "البرنامج مناسب للراغبين في دخول مجال التسويق الرقمي، أصحاب المشاريع، الموظفين، المستقلين، وكل من يريد بناء مهارة عملية يمكن استخدامها في سوق العمل أو في تطوير نشاط تجاري حقيقي." : "The program is suitable for people entering digital marketing, business owners, employees, freelancers, and anyone building a practical skill for work or business growth."}</p>
        </div>
      </div>
    </section>}
    <section className="section">
      <div className="container split">
        <div>
          <p className="eyebrow">{ar ? "لمن هذا البرنامج؟" : "Who Is It For?"}</p>
          <h2 className="h2">{ar ? "مصمم لأصحاب المشاريع والمهنيين والراغبين في تطوير مهارات عملية" : "Built for business owners, professionals, and practical learners"}</h2>
        </div>
        <ul className="feature-list">
          {(ar ? ["أصحاب المشاريع الصغيرة والمتوسطة", "الموظفون والمستقلون", "فرق التسويق والمبيعات", "الراغبون في دخول المجال بثقة"] : ["Small and medium business owners", "Employees and freelancers", "Marketing and sales teams", "Learners entering the field"]).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </section>
    <section className="section band" id="course-content">
      <div className="container">
        <SectionHeader eyebrow={ar ? "المحاور" : "Curriculum"} title={ar ? "ماذا ستتعلم؟" : "What You Will Learn"} />
        <div className="grid service-grid">{course.modules.map(([title, text], index) => <article className="card article-card" key={title}><p className="eyebrow">{String(index + 1).padStart(2, "0")}</p><h2 className="h3">{title}</h2><p className="muted">{text}</p></article>)}</div>
      </div>
    </section>
    {isDigitalMarketing && <section className="section" id="registration">
      <div className="container split course-registration">
        <div>
          <p className="eyebrow">{ar ? "التسجيل في البرنامج" : "Program registration"}</p>
          <h2 className="h2">{ar ? "طلب الالتحاق بدورة التسويق الرقمي" : "Apply for the Digital Marketing Course"}</h2>
          <p className="lead">{ar ? "يرجى تعبئة بياناتك بدقة. سيتم مراجعة طلب التسجيل والتواصل معك لتوضيح تفاصيل البرنامج والخطوات التالية." : "Share your details accurately. We will review your application and contact you with the program details and next steps."}</p>
          <ul className="feature-list">{(ar ? ["تدريب عملي ومنهجي", "محتوى حديث وقابل للتطبيق", "استراتيجيات تسويق واضحة", "تطبيقات وأدوات عملية", "متابعة وتوجيه خلال البرنامج"] : ["Practical, structured training", "Current, applicable content", "Clear marketing strategies", "Practical tools and applications", "Guidance throughout the program"]).map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <ContactForm locale={locale} consultation />
      </div>
    </section>}
    <section className="section">
      <div className="container split">
        <div>
          <p className="eyebrow">{ar ? "الأدوات وطريقة التقديم" : "Tools and Delivery"}</p>
          <h2 className="h2">{ar ? "تعلم واضح، تطبيق مباشر، ومراجعة مستمرة" : "Clear teaching, direct practice, and continuous review"}</h2>
        </div>
        <div className="experience-points">{tools.map((item) => <span className="experience-chip" key={item}>{item}</span>)}</div>
      </div>
    </section>
    <section className="section band">
      <div className="container">
        <SectionHeader eyebrow={ar ? "أسئلة شائعة" : "FAQ"} title={ar ? "قبل التسجيل" : "Before You Register"} />
        <div className="grid credentials-grid">{faq.map(([q, a]) => <article className="card training-card" key={q}><h2 className="h3">{q}</h2><p className="muted">{a}</p></article>)}</div>
      </div>
    </section>
    <section className="section"><div className="container cta"><div><h2 className="h2">{ar ? "هل تريد اختيار المسار الأنسب؟" : "Want to choose the right path?"}</h2><p className="lead">{ar ? "ابدأ برسالة قصيرة وسنرتب الخطوة التدريبية المناسبة." : "Start with a short message and we will shape the right training path."}</p></div><WhatsAppLink>{ar ? "تواصل عبر واتساب" : "WhatsApp"}</WhatsAppLink></div></section>
  </>;
}

const graphicDesignModules = [
  ["أساسيات التصميم وكيفية توصيل الفكرة بصرياً", "فهم المطلوب وتحويله إلى فكرة تصميم واضحة، مع مبادئ التوازن والتباين والمحاذاة والتكرار والمساحات."],
  ["اختيار الألوان وتنسيقها باحتراف", "عجلة الألوان والانسجام والتباين وسيكولوجية اللون وإنشاء لوحة ألوان متناسقة لمشروع عملي."],
  ["اختيار الخطوط وترتيب النصوص", "اختيار الخط المناسب وترتيب العناوين والنصوص وتنظيم المحاذاة والمسافات باستخدام الشبكات."],
  ["Adobe Photoshop", "معالجة الصور وصناعة التكوينات الإعلانية باستخدام الطبقات والأقنعة وأدوات التحديد والعناصر الذكية."],
  ["Adobe Illustrator", "الرسم المتجهي وبناء الأيقونات والعناصر القابلة للتكبير وإعداد الشعارات بصيغ احترافية."],
  ["تصميم الشعار وبناء الهوية البصرية", "البحث وتحديد الفكرة، اختيار اللون والخط والنمط، ثم إنشاء تطبيقات أساسية متسقة للهوية."],
  ["التصميم التسويقي والسوشيال ميديا", "تصميم منشورات وحملات وسلاسل محتوى متناسقة تخدم هدفاً تسويقياً واضحاً وتتكيف مع المنصات."],
  ["تجهيز الطباعة والذكاء الاصطناعي وبناء ملف الأعمال", "تجهيز الملفات للطباعة، استخدام AI للبحث والتصور والإنتاج، وتنظيم أفضل الأعمال داخل ملف مهني."]
];

function GraphicDesignCoursePage({ locale, image }: { locale: Locale; image: string }) {
  const ar = locale === "ar";
  const outcomes = ar ? [
    ["فهم متطلبات أي مشروع تصميم", "تحديد الجمهور والرسالة واختيار أسلوب التصميم المناسب قبل البدء."],
    ["بناء تكوين احترافي", "ترتيب الخطوط والألوان والصور والمساحات بطريقة واضحة ومريحة للعين."],
    ["تنفيذ مواد تسويقية", "تصميم منشورات وإعلانات متناسقة تخدم العلامة التجارية والهدف التسويقي."],
    ["إنشاء هوية بصرية متكاملة للمبتدئين", "تطوير فكرة الهوية وتصميم شعار واختيار الألوان والخطوط والتطبيقات الأساسية."],
    ["تجهيز ملفات رقمية وطباعية", "اختيار المقاس والدقة ونمط الألوان والصيغة المناسبة لكل استخدام."],
    ["تسريع خطوات العمل باستخدام الذكاء الاصطناعي", "استخدام أدوات AI في البحث عن الأفكار وتطويرها وتسريع مراحل التصميم."]
  ] : [
    ["Understand any design brief", "Define the audience and message, then choose the right visual direction."],
    ["Build a professional composition", "Arrange type, color, imagery, and space for clarity and visual comfort."],
    ["Create marketing materials", "Design consistent social posts and ads that serve the brand and campaign goal."],
    ["Build a beginner-friendly visual identity", "Develop a concept, logo, colors, typography, and essential applications."],
    ["Prepare digital and print files", "Choose the right size, resolution, color mode, and output format."],
    ["Accelerate work with AI", "Use AI tools for research, ideation, development, and selected production steps."]
  ];
  const projects = ar ? [
    ["PROJECT 01", "نظام بصري مصغّر", "لوحة ألوان وخطوط وGrid وعناصر بصرية متناسقة حول فكرة محددة."],
    ["PROJECT 02", "حملة سوشيال ميديا", "سلسلة منشورات وإعلان رئيسي ضمن هوية واحدة ورسالة تسويقية واضحة."],
    ["PROJECT 03", "هوية علامة أولية", "مفهوم شعار مع نظام ألوان وخطوط وبعض التطبيقات الأساسية."],
    ["FINAL PROJECT", "مشروع ختامي", "مشروع متكامل يجمع البحث والفكرة والتنفيذ والعرض النهائي بصورة مهنية."]
  ] : [
    ["PROJECT 01", "Mini visual system", "A coordinated color palette, type system, grid, and visual elements around one idea."],
    ["PROJECT 02", "Social media campaign", "A series of posts and a key ad within one identity and clear marketing message."],
    ["PROJECT 03", "Initial brand identity", "A logo concept with a color and type system and essential applications."],
    ["FINAL PROJECT", "Final project", "A complete project combining research, concept, execution, and professional presentation."]
  ];
  const audience = ar ? ["المبتدئ من الصفر", "المصمم المبتدئ", "المسوق وصاحب المشروع", "من يريد العمل الحر"] : ["Complete beginners", "Junior designers", "Marketers and business owners", "People preparing for freelance work"];
  const requirements = ar ? ["كمبيوتر مناسب للتطبيق العملي وتشغيل برامج التصميم المطلوبة.", "الالتزام بالتطبيق وتنفيذ التمارين والمشاريع، وليس المشاهدة فقط.", "رغبة في التعلم، ولا يشترط تخصص أكاديمي سابق في الفن أو التصميم."] : ["A suitable computer for practical work and the required design software.", "Commitment to practice and completing exercises and projects, not watching only.", "A desire to learn; no previous academic specialization in art or design is required."];
  const method = ar ? [["تعلّم", "مفهوم واضح وقاعدة تصميمية."], ["شاهد", "مثال وتحليل للتطبيق الصحيح."], ["طبّق", "مهمة عملية مرتبطة بالمحور."], ["راجع", "ملاحظة الأخطاء ونقاط التحسين."], ["طوّر", "إعادة التنفيذ بمستوى أعلى."]] : [["Learn", "A clear concept and design principle."], ["Watch", "An example and analysis of the right application."], ["Apply", "A practical task connected to the module."], ["Review", "Spot errors and improvement opportunities."], ["Develop", "Rebuild the work at a higher level."]];
  return <>
    <section className="page-hero course-hero"><div className="container split"><div><p className="eyebrow">{ar ? "منهج أكاديمي + تطبيق عملي" : "Academic method + practical application"}</p><h1 className="h1">{ar ? "دورة التصميم الجرافيكي" : "Graphic Design Course"}</h1><p className="lead">{ar ? "تعلّم التصميم كمنظومة تفكير ومهارة مهنية من خلال مسار واضح يبدأ من مبادئ الاتصال البصري وينتهي بمشاريع حقيقية وملف أعمال." : "Learn design as a thinking system and professional skill through a clear path from visual communication fundamentals to real projects and a portfolio."}</p><div className="hero-actions"><a className="btn btn-primary" href="#registration">{ar ? "ابدأ طلب التسجيل" : "Start your application"}</a><a className="btn btn-secondary" href="#course-content">{ar ? "استعرض الخطة" : "Explore the curriculum"}</a></div></div><Image className="course-hero-image" src={image} alt={ar ? "دورة التصميم الجرافيكي" : "Graphic design course"} width={1600} height={1600} priority /></div></section>
    <section className="section"><div className="container split"><div><p className="eyebrow">{ar ? "رحلة تعليمية واضحة" : "A clear learning journey"}</p><h2 className="h2">{ar ? "تعلّم لماذا ينجح التصميم قبل أن تتعلم كيف تنفذه" : "Understand why design works before learning how to execute it"}</h2></div><div className="article-body"><p>{ar ? "الدورة مبنية على تسلسل تعليمي واضح: تبدأ من مبادئ الاتصال البصري، ثم تنتقل إلى الأدوات، وبعدها إلى بناء المشاريع." : "The course follows a clear sequence: visual communication principles, tools, and then project building."}</p><p>{ar ? "الهدف أن تفهم ترتيب العناصر والتوازن والألوان والخطوط، ثم تحول الفكرة إلى تصميم واضح واحترافي قابل للاستخدام." : "The goal is to understand composition, balance, color, and typography, then turn an idea into clear, professional work."}</p></div></div></section>
    <section className="section band"><div className="container"><SectionHeader eyebrow={ar ? "أساس المسار" : "The course foundation"} title={ar ? "ثلاث مراحل تبني مهارتك خطوة بخطوة" : "Three stages that build your skill step by step"} /><div className="grid credentials-grid">{(ar ? [["الفهم البصري", "ترتيب العناصر وتحقيق التوازن واختيار الألوان والخطوط وتوجيه عين المشاهد."], ["إتقان الأدوات", "استخدام Photoshop وIllustrator بطريقة منظمة لتحويل الفكرة إلى تصميم احترافي."], ["مشاريع حقيقية", "تطبيق ما تتعلمه في مشاريع قابلة للتطوير والإضافة إلى ملف أعمالك."]] : [["Visual understanding", "Arrange elements, create balance, choose color and type, and guide the viewer's eye."], ["Tool mastery", "Use Photoshop and Illustrator in a structured way to turn ideas into professional designs."], ["Real projects", "Apply your learning to projects that can grow into a professional portfolio."]]).map(([title, text]) => <article className="card training-card" key={title}><h2 className="h3">{title}</h2><p className="muted">{text}</p></article>)}</div></div></section>
    <section className="section" id="course-content"><div className="container"><SectionHeader eyebrow={ar ? "الخطة الأكاديمية" : "Academic curriculum"} title={ar ? "ماذا ستدرس خطوة بخطوة؟" : "What will you study step by step?"}>{ar ? "ثمانية محاور مرتبة تبدأ من أساسيات التصميم ثم الأدوات والتطبيق وتنتهي بمشروع بصري متكامل." : "Eight ordered modules move from design fundamentals through tools and practice to a complete visual project."}</SectionHeader><div className="grid service-grid">{graphicDesignModules.map(([title, text], index) => <article className="card article-card" key={title}><p className="eyebrow">{String(index + 1).padStart(2, "0")}</p><h2 className="h3">{ar ? title : ["Design fundamentals and visual communication", "Professional color selection", "Typography and text hierarchy", "Adobe Photoshop", "Adobe Illustrator", "Logo and visual identity design", "Marketing and social media design", "Print, AI, and portfolio preparation"][index]}</h2><p className="muted">{ar ? text : ["Turn a brief into a clear concept using balance, contrast, alignment, repetition, space, audience, and visual analysis.", "Use color harmony, contrast, psychology, and a coherent palette in a practical project.", "Choose type, hierarchy, grids, alignment, and spacing for clear, engaging layouts.", "Use layers, masks, selections, and smart objects to create clean advertising compositions.", "Build scalable icons, vector elements, and professional logo assets.", "Research a concept, choose the visual system, and create consistent identity applications.", "Create campaigns and content series that adapt to platforms without losing identity.", "Prepare print files, use AI for research and ideation, and organize a professional portfolio."][index]}</p></article>)}</div></div></section>
    <section className="section band"><div className="container"><SectionHeader eyebrow={ar ? "ماذا ستتعلم فعلياً؟" : "Practical outcomes"} title={ar ? "ماذا ستكون قادراً على إنجازه؟" : "What will you be able to create?"} /><div className="grid credentials-grid">{outcomes.map(([title, text]) => <article className="card training-card" key={title}><h2 className="h3">✓ {title}</h2><p className="muted">{text}</p></article>)}</div></div></section>
    <section className="section"><div className="container"><SectionHeader eyebrow={ar ? "طريقة التدريب" : "Learning method"} title={ar ? "تعلّم ← شاهد ← طبّق ← راجع ← طوّر" : "Learn → Watch → Apply → Review → Develop"} /><div className="grid service-grid">{method.map(([title, text], index) => <article className="card article-card" key={title}><p className="eyebrow">{String(index + 1).padStart(2, "0")}</p><h2 className="h3">{title}</h2><p className="muted">{text}</p></article>)}</div></div></section>
    <section className="section band"><div className="container"><SectionHeader eyebrow={ar ? "المشاريع التطبيقية" : "Applied projects"} title={ar ? "لن تتخرج بمعلومات فقط" : "Graduate with more than information"} /><div className="grid credentials-grid">{projects.map(([label, title, text]) => <article className="card training-card" key={title}><p className="eyebrow">{label}</p><h2 className="h3">{title}</h2><p className="muted">{text}</p></article>)}</div></div></section>
    <section className="section"><div className="container split"><div><SectionHeader eyebrow={ar ? "لمن صُممت الدورة؟" : "Who is it for?"} title={ar ? "مناسبة لمن يريد أساساً قوياً ومساراً واضحاً" : "For anyone who wants a strong foundation and clear path"} /></div><div className="experience-points">{audience.map((item) => <span className="experience-chip" key={item}>{item}</span>)}</div></div></section>
    <section className="section band"><div className="container split"><div><SectionHeader eyebrow={ar ? "متطلبات الالتحاق" : "Requirements"} title={ar ? "لا تحتاج خبرة سابقة" : "No previous experience required"} /></div><div className="grid">{requirements.map((item, index) => <article className="card training-card" key={item}><h2 className="h3">{index + 1}. {item.split(".")[0]}</h2><p className="muted">{item}</p></article>)}</div></div></section>
    <section className="section" id="registration"><div className="container split course-registration"><div><p className="eyebrow">{ar ? "ابدأ طلب التسجيل" : "Start your application"}</p><h2 className="h2">{ar ? "دعم المسار التعليمي" : "Support throughout your learning path"}</h2><p className="lead">{ar ? "قناة تلغرام خاصة، متابعة لمدة شهرين بعد انتهاء الدورة، وتفاعل مباشر لمراجعة التطور والإجابة عن أسئلة التطبيق العملي." : "A private Telegram channel, two months of follow-up after the course, and direct interaction for practical questions and progress review."}</p><ul className="feature-list">{(ar ? ["تطبيق عملي في كل مرحلة", "شهادة إتمام بعد استكمال المتطلبات", "مرونة في الوقت والتطبيق", "تفاعل مباشر وطرح الأسئلة"] : ["Practical work at every stage", "Certificate after completing requirements", "Flexible learning and practice", "Direct interaction and questions"]).map((item) => <li key={item}>{item}</li>)}</ul></div><ContactForm locale={locale} consultation /></div></section>
    <section className="section band"><div className="container cta"><div><p className="eyebrow">{ar ? "المقاعد محدودة" : "Limited places"}</p><h2 className="h2">{ar ? "جاهز تبدأ رحلتك في التصميم؟" : "Ready to start your design journey?"}</h2><p className="lead">{ar ? "عبّئ نموذج التسجيل، وسيتم التواصل معك بعد مراجعة بياناتك." : "Complete the application and we will contact you after reviewing your details."}</p></div><WhatsAppLink>{ar ? "ابدأ المحادثة" : "Start the conversation"}</WhatsAppLink></div></section>
  </>;
}

function WordPressCoursePage({ locale, image }: { locale: Locale; image: string }) {
  const ar = locale === "ar";
  const learning = ar ? [
    ["إعداد موقع WordPress وتجهيزه", "فهم المتطلبات الأساسية وتجهيز الموقع للعمل بطريقة منظمة."],
    ["اختيار القالب المناسب", "اختيار قالب يخدم هدف الموقع، مع فهم المظهر والأداء وسهولة الاستخدام."],
    ["إنشاء الصفحات والأقسام الرئيسية", "بناء صفحات واضحة وتنظيم المحتوى والأقسام الأساسية للموقع."],
    ["تنسيق النصوص والصور والمحتوى", "إدارة المحتوى بصرياً وبناء صفحات متناسقة وسهلة القراءة."],
    ["الإضافات والقوائم والتنقل", "استخدام الإضافات المهمة وتنظيم القوائم والتنقل بين الصفحات."],
    ["التجاوب وتجهيز الموقع لمحركات البحث", "ضبط تجربة الموقع على مختلف الأجهزة وفهم أساسيات SEO."],
    ["المراجعة والإطلاق", "مراجعة الموقع واختبار جاهزيته قبل النشر والتسليم." ]
  ] : [
    ["Set up a WordPress website", "Understand the essentials and prepare the site for practical work."],
    ["Choose the right theme", "Choose a theme that supports the site goal, usability, and performance."],
    ["Create pages and key sections", "Build clear pages and organize the main sections of a website."],
    ["Format text, images, and content", "Manage content visually and create consistent, readable pages."],
    ["Plugins, menus, and navigation", "Use essential plugins and organize menus and navigation."],
    ["Responsive design and SEO foundations", "Prepare the site for different devices and understand SEO basics."],
    ["Review and launch", "Review the site and confirm it is ready before publishing and handover."]
  ];
  const audience = ar ? ["مبتدئ تماماً يريد فهم WordPress من البداية", "مسوق إلكتروني يريد إضافة تصميم المواقع إلى خدماته", "صاحب مشروع يريد إنشاء موقع وإدارته بنفسه", "من يريد تطوير مهارة عملية قابلة للنمو"] : ["Complete beginners who want to understand WordPress", "Digital marketers adding website design to their services", "Business owners who want to build and manage a site", "Anyone building a practical, expandable skill"];
  const features = ar ? ["أساسيات WordPress ولوحة التحكم", "اختيار القوالب والإضافات المناسبة", "بناء صفحات وأقسام منظمة", "تجهيز الموقع لمختلف الأجهزة", "أساسيات تحسين محركات البحث", "مراجعة الموقع قبل الإطلاق"] : ["WordPress fundamentals and dashboard", "Choosing suitable themes and plugins", "Building organized pages and sections", "Preparing the site for different devices", "SEO foundations", "Reviewing the site before launch"];
  return <>
    <section className="page-hero course-hero"><div className="container split"><div><p className="eyebrow">{ar ? "كورس تصميم مواقع ووردبريس من الصفر" : "WordPress website design from zero"}</p><h1 className="h1">{ar ? "كورس تصميم مواقع ووردبريس من الصفر" : "WordPress Website Design from Scratch"}</h1><p className="lead">{ar ? "تعلّم، طبّق، وابنِ موقعك بنفسك من خلال تدريب عملي ومنظم يبدأ من الأساسيات ولا يفترض معرفة سابقة بالبرمجة." : "Learn, practice, and build your own website through a practical, structured course that starts from the basics and requires no previous coding knowledge."}</p><div className="hero-actions"><a className="btn btn-primary" href="#registration">{ar ? "ابدأ طلب التسجيل" : "Start your application"}</a><a className="btn btn-secondary" href="#course-content">{ar ? "استعرض محتوى الكورس" : "Explore the course"}</a></div></div><Image className="course-hero-image" src={image} alt={ar ? "كورس تصميم مواقع ووردبريس" : "WordPress website design course"} width={1600} height={1600} priority /></div></section>
    <section className="section"><div className="container split"><div><p className="eyebrow">{ar ? "ابدأ من الأساسيات" : "Start with the fundamentals"}</p><h2 className="h2">{ar ? "هل تريد تعلم تصميم المواقع، لكنك لا تعرف من أين تبدأ؟" : "Want to learn website design but do not know where to begin?"}</h2></div><div className="article-body"><p>{ar ? "قد تبدو فكرة إنشاء موقع إلكتروني في البداية معقدة، خصوصاً عندما تسمع عن البرمجة والاستضافة والقوالب والإضافات وتجهيز الموقع لمحركات البحث." : "Building a website can feel complex when you hear about coding, hosting, themes, plugins, and search engine preparation."}</p><p>{ar ? "في هذا الكورس نبدأ معك من الأساسيات وبطريقة عملية ومنظمة، حتى تتعرف على طريقة بناء موقع باستخدام WordPress وتفهم الأدوات التي تحتاجها في كل مرحلة." : "This course starts from the essentials in a practical, organized way so you understand how to build a WordPress website and which tools matter at each stage."}</p></div></div></section>
    <section className="section band" id="course-content"><div className="container"><SectionHeader eyebrow={ar ? "ماذا ستتعلم؟" : "What you will learn"} title={ar ? "من لوحة التحكم إلى موقع جاهز" : "From dashboard to launch-ready website"}><span>{ar ? "تدرّج واضح ينقلك من فهم WordPress إلى بناء موقع وإدارته بثقة." : "A clear progression from understanding WordPress to building and managing a site with confidence."}</span></SectionHeader><div className="grid service-grid">{learning.map(([title, text], index) => <article className="card article-card" key={title}><p className="eyebrow">{String(index + 1).padStart(2, "0")}</p><h2 className="h3">{title}</h2><p className="muted">{text}</p></article>)}</div></div></section>
    <section className="section"><div className="container split"><div><p className="eyebrow">{ar ? "لماذا WordPress؟" : "Why WordPress?"}</p><h2 className="h2">{ar ? "افهم ما تفعله ولماذا تفعله" : "Understand what you are doing and why"}</h2></div><div className="article-body"><p>{ar ? "لا تحتاج إلى البدء من عالم البرمجة المعقدة حتى تفهم أساسيات إنشاء المواقع. يمنحك WordPress بيئة عملية تساعدك على بناء وإدارة محتوى موقعك." : "You do not need to start with complex programming to understand website creation. WordPress provides a practical environment for building and managing site content."}</p><p>{ar ? "ستتعرف على طريقة استخدام القوالب والإضافات وتطوير الموقع تدريجياً حسب احتياجك، وليس مجرد معرفة أين تضغط." : "You will learn how to use themes and plugins and develop the site according to its needs, rather than simply memorizing where to click."}</p></div></div></section>
    <section className="section band"><div className="container"><SectionHeader eyebrow={ar ? "ماذا بعد الكورس؟" : "After the course"} title={ar ? "أساس واضح لتطبيق ما تعلمته" : "A clear foundation for practical work"} /><div className="grid credentials-grid">{features.map((item) => <article className="card training-card" key={item}><h2 className="h3">✓ {item}</h2></article>)}</div></div></section>
    <section className="section"><div className="container"><SectionHeader eyebrow={ar ? "لمن هذا الكورس؟" : "Who is it for?"} title={ar ? "مناسب لمن يريد بناء مهارة عملية" : "For anyone building a practical skill"} /><div className="experience-points">{audience.map((item) => <span className="experience-chip" key={item}>{item}</span>)}</div></div></section>
    <section className="section band" id="registration"><div className="container split course-registration"><div><p className="eyebrow">{ar ? "ابدأ من الصفر" : "Start from zero"}</p><h2 className="h2">{ar ? "لا تحتاج إلى أن تكون مبرمجاً حتى تبدأ" : "You do not need to be a programmer to begin"}</h2><p className="lead">{ar ? "تحتاج فقط إلى الرغبة في التعلم والاستعداد للتطبيق. عبّئ نموذج التسجيل وسيتم التواصل معك بعد مراجعة بياناتك." : "You only need the desire to learn and willingness to practice. Complete the application and we will contact you after reviewing your details."}</p><ul className="feature-list">{(ar ? ["تعلم الأساسيات بشكل صحيح", "طبّق بنفسك على خطوات واضحة", "طوّر مستواك خطوة بخطوة"] : ["Learn the foundations correctly", "Practice with clear steps", "Develop your level step by step"]).map((item) => <li key={item}>{item}</li>)}</ul></div><ContactForm locale={locale} consultation /></div></section>
    <section className="section"><div className="container cta"><div><p className="eyebrow">{ar ? "كورس تصميم مواقع WordPress" : "WordPress website design course"}</p><h2 className="h2">{ar ? "تعلّم، طبّق، وابنِ موقعك بنفسك" : "Learn, practice, and build your own website"}</h2></div><WhatsAppLink>{ar ? "ابدأ المحادثة" : "Start the conversation"}</WhatsAppLink></div></section>
  </>;
}

export function ContactPage({ locale, consultation = false }: { locale: Locale; consultation?: boolean }) {
  const ar = locale === "ar";
  return <>
    <PageHero locale={locale} eyebrow={consultation ? (ar ? "استشارة" : "Consultation") : (ar ? "تواصل" : "Contact")} title={consultation ? (ar ? "اطلب استشارة" : "Book a Consultation") : (ar ? "ابدأ المحادثة" : "Start the Conversation")} lead={ar ? "شارك تفاصيل مشروعك أو تحديك، وسنرتب الخطوة التالية بوضوح." : "Share your project or growth challenge and we will shape the next practical step."} />
    <section className="section"><div className="container split"><div><h2 className="h2">{ar ? "بيانات التواصل" : "Contact Details"}</h2><p><a href={person.phoneHref}><span className="ltr-text">{person.phoneDisplay}</span></a></p><p><a href={`mailto:${person.email}`}><span className="ltr-text">{person.email}</span></a></p><p>{person.location[locale]}</p></div><ContactForm locale={locale} consultation={consultation} /></div></section>
  </>;
}

export function PrivacyPage({ locale, cmsItems = [] }: { locale: Locale; cmsItems?: CmsContentItem[] }) {
  const ar = locale === "ar";
  const policy = cmsItems.find((item) => item.type === "privacy" && (locale === "ar" || item.meta?.englishStatus === "published"));
  const body = locale === "ar" ? policy?.bodyAr : policy?.bodyEn;
  return <><PageHero locale={locale} eyebrow={ar ? "الخصوصية" : "Privacy"} title={ar ? "سياسة الخصوصية" : "Privacy Policy"} lead={ar ? "نوضح هنا كيف نتعامل مع بيانات التواصل التي يشاركها الزائر." : "This page explains how contact information shared by visitors is handled."} /><section className="section"><div className="container article-body"><h2 className="h2">{ar ? "البيانات التي نجمعها" : "Information we collect"}</h2><p>{body || (ar ? "قد نجمع الاسم والبريد الإلكتروني ورقم الهاتف وتفاصيل المشروع عند إرسال نموذج التواصل، وذلك للرد على الاستفسار ومناقشة الخدمة المطلوبة. لا نبيع بياناتك ولا نشاركها لأغراض تسويقية غير مرتبطة بطلبك." : "We may collect your name, email, phone number, and project details when you submit the contact form. We do not sell your data or share it for unrelated marketing.")}</p><h2 className="h2">{ar ? "التواصل" : "Contact"}</h2><p>{ar ? `للاستفسار حول الخصوصية، تواصل عبر ${person.email}.` : `For privacy questions, contact ${person.email}.`}</p></div></section></>;
}

export function ArticlePage({ locale, slug, cmsItems = [] }: { locale: Locale; slug: string; cmsItems?: CmsContentItem[] }) {
  return <EditorialArticlePage locale={locale} slug={slug} cmsItems={cmsItems} />;
}


