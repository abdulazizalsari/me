import Image from "next/image";
import { ArrowUpLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { copy, person } from "@/data/site";
import { services as staticServices } from "@/data/services";
import { projects as staticProjects, projectCategories, projectCategoryLabels } from "@/data/projects";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { CmsContentItem } from "@/lib/cms/types";
import { iconForItem } from "@/lib/cms/render";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AnimatedMetric } from "@/components/ui/AnimatedMetric";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { cmsImage } from "@/lib/cms/media";
import { HomeInsightsSection } from "@/app/_components/InsightsBlog";

function publicItemsForLocale(items: CmsContentItem[], locale: Locale) {
  if (locale === "ar") return items;
  return items.filter((item) => item.titleEn.trim() && item.summaryEn.trim() && item.meta?.englishStatus === "published");
}

function cmsServices(items: CmsContentItem[]) {
  const rows = items.filter((item) => item.type === "service");
  return rows.length ? rows.map((item) => ({
    slug: item.slug,
    icon: iconForItem(item),
    title: { ar: item.titleAr, en: item.titleEn },
    description: { ar: item.summaryAr, en: item.summaryEn },
    detailHref: `/services/${item.slug}`
  })) : staticServices.map((service) => ({ ...service, detailHref: `/services/${service.slug}` }));
}

function cmsProjects(items: CmsContentItem[]) {
  const rows = items.filter((item) => item.type === "project");
  return rows.length ? rows.map((item) => ({
    slug: item.slug,
    title: { ar: item.titleAr, en: item.titleEn },
    client: typeof item.meta?.client === "string" ? item.meta.client : "Portfolio",
    category: ["Websites", "Branding", "Marketing", "E-Commerce", "Social Media", "Business"].includes(item.category ?? "") ? item.category : "Business",
    year: typeof item.meta?.year === "string" ? item.meta.year : item.updatedAt.slice(0, 4),
    description: { ar: item.summaryAr, en: item.summaryEn },
    services: Array.isArray(item.meta?.services) ? item.meta.services.map(String) : [item.category || "Business"],
    image: cmsImage(item.meta, "imageAssetId", typeof item.meta?.image === "string" ? item.meta.image : "").url,
    imageAlt: { ar: cmsImage(item.meta, "imageAssetId", "").altAr, en: cmsImage(item.meta, "imageAssetId", "").altEn }
  })) : staticProjects.map((project) => ({ ...project, image: "image" in project && typeof project.image === "string" ? project.image : "", imageAlt: undefined }));
}

function cmsCourses(items: CmsContentItem[]) {
  const trainingSlugs = ["digital-marketing-course", "graphic-design-course", "wordpress-course"];
  const rows = items.filter((item) => item.type === "course");
  const sourceRows = rows.length ? rows : items.filter((item) => item.type === "project" && trainingSlugs.includes(item.slug));
  return sourceRows.map((item) => ({
    slug: item.slug,
    title: { ar: item.titleAr, en: item.titleEn },
    client: typeof item.meta?.client === "string" ? item.meta.client : "Training",
    category: ["Websites", "Branding", "Marketing", "E-Commerce", "Social Media", "Business"].includes(item.category ?? "") ? item.category : "Business",
    year: typeof item.meta?.year === "string" ? item.meta.year : item.updatedAt.slice(0, 4),
    description: { ar: item.summaryAr, en: item.summaryEn },
    services: Array.isArray(item.meta?.services) ? item.meta.services.map(String) : [item.category || "Training"],
    image: cmsImage(item.meta, "imageAssetId", typeof item.meta?.image === "string" ? item.meta.image : "").url,
    imageAlt: { ar: cmsImage(item.meta, "imageAssetId", "").altAr, en: cmsImage(item.meta, "imageAssetId", "").altEn }
  }));
}

const homeSectionKeys = ["hero", "intro", "experience", "services", "stats", "training", "expertise", "insights", "cta"] as const;

function sectionState(meta: Record<string, unknown> | undefined, key: (typeof homeSectionKeys)[number]) {
  const sections = Array.isArray(meta?.homeSections) ? meta.homeSections as Record<string, unknown>[] : [];
  const configured = sections.find((section) => section.key === key);
  return {
    visible: configured?.visible !== false,
    order: typeof configured?.order === "number" ? configured.order : homeSectionKeys.indexOf(key) + 1
  };
}

export function HomePage({ locale, cmsItems = [] }: { locale: Locale; cmsItems?: CmsContentItem[] }) {
  const c = copy[locale];
  const ar = locale === "ar";
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  const localizedCmsItems = publicItemsForLocale(cmsItems, locale);
  const services = cmsServices(localizedCmsItems);
  const projects = cmsProjects(localizedCmsItems);
  const courses = cmsCourses(localizedCmsItems);
  const homepageMeta = cmsItems.find((item) => item.type === "homepage")?.meta as Record<string, unknown> | undefined;
  const portrait = cmsImage(homepageMeta, "portraitImageAssetId", "/images/abdulaziz/abdulaziz-alsari.png");
  const trainingSlugs = ["digital-marketing-course", "graphic-design-course", "wordpress-course"];
  const trainingCourses = trainingSlugs
    .map((slug) => courses.find((course) => course.slug === slug) ?? projects.find((project) => project.slug === slug) ?? staticProjects.find((project) => project.slug === slug))
    .filter((project): project is NonNullable<typeof project> => Boolean(project));

  return (
    <div className="home-page-sections">
      {sectionState(homepageMeta, "hero").visible && <section className="hero" style={{ order: sectionState(homepageMeta, "hero").order }}>
        <div className="container hero-layout">
          <div className="hero-copy">
            <div className="eyebrow">{c.tagline}</div>
            <h1 className="h1">{ar ? "أساعدك على بناء حضور رقمي أقوى بتسويق عملي وتجربة احترافية" : "I help you build a stronger digital presence with practical marketing and polished execution"}</h1>
            <p className="lead">
              {ar
                ? "أقدّم خدمات رقمية وتدريبًا عمليًا يجمع بين استراتيجية التسويق، إدارة الحملات، تصميم المواقع، تطوير الأعمال، وبناء تجربة واضحة تساعد مشروعك على النمو بثقة."
                : "I provide digital services and practical training across marketing strategy, campaign management, website design, business development, and clear execution that helps your project grow with confidence."}
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href={withLocale(locale, "/consultation")}>{c.book}</a>
              <a className="btn btn-secondary" href={withLocale(locale, "/services")}>{ar ? "معرفة المزيد" : "Learn More"}</a>
            </div>
          </div>

          <figure className="portrait-card" aria-label={ar ? "صورة عبدالعزيز الصاري المهنية" : "Professional portrait of AbdulAziz Al-Sari"}>
            <div className="portrait-bg-grid" aria-hidden="true" />
            <div className="portrait-curve" aria-hidden="true" />
            <div className="portrait-frame" aria-hidden="true" />
            <div className="portrait-image-wrap">
              <Image
                src={portrait.url}
                alt={ar ? portrait.altAr || "عبدالعزيز الصاري" : portrait.altEn || "AbdulAziz Al-Sari"}
                fill
                priority
                sizes="(max-width: 760px) calc(100vw - 32px), 48vw"
                className="portrait-image"
              />
            </div>
            <div className="portrait-status">
              <span className="status-dot" aria-hidden="true" />
              <span>{ar ? "حالة العمل" : "CURRENT STATUS"}</span>
              <strong>{ar ? "مدرب ومطور" : "TRAINER & DEVELOPER"}</strong>
            </div>
            <div className="portrait-location">
              {(ar ? ["تسويق رقمي", "تطوير أعمال", "تجارة دولية"] : ["Digital Marketing", "Business Development", "International Trade"]).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </figure>
        </div>
      </section>}

      {sectionState(homepageMeta, "intro").visible && <section className="academic-intro" style={{ order: sectionState(homepageMeta, "intro").order }}>
        <div className="container academic-intro-inner">
          <p className="academic-intro-text">
            {ar
              ? "أعمل في التسويق الرقمي والتدريب وتطوير الأعمال بخبرة تجمع بين التخطيط، التصميم، الحملات الإعلانية، وإدارة المشاريع. أركز على حلول عملية تناسب هدف المشروع وجمهوره بدل الاكتفاء بمظهر جميل فقط."
              : "I work across digital marketing, training, and business development with experience in planning, design, advertising campaigns, and project management. I focus on practical solutions shaped around each project's goals and audience."}
          </p>
          <a className="btn btn-secondary" href={withLocale(locale, "/about")}>{ar ? "معرفة المزيد" : "Learn More"}</a>
        </div>
      </section>}

      {sectionState(homepageMeta, "experience").visible && <section className="section experience-section" style={{ order: sectionState(homepageMeta, "experience").order }}>
        <div className="container split">
          <div className="experience-copy">
            <p className="eyebrow">{ar ? "خبرة عملية ورؤية متكاملة" : "Practical Experience and Integrated Vision"}</p>
            <h2 className="h2">
              {ar
                ? "خبرة تجمع بين التسويق، تطوير الأعمال، والتدريب"
                : "Experience Across Marketing, Business Development, and Training"}
            </h2>
            <p className="lead">
              {ar
                ? "أجمع بين خبرة عملية في التسويق الرقمي، التخطيط الاستراتيجي، تطوير الأعمال، تصميم المواقع، الحملات الإعلانية، التصميم الجرافيكي، وإدارة المشاريع، مع اهتمام واضح بالتجارة الدولية وبناء قدرات الأفراد والفرق."
                : "I combine practical experience in digital marketing, strategic planning, business development, websites, advertising campaigns, graphic design, project management, and international trade."}
            </p>
            <a className="btn btn-primary" href={withLocale(locale, "/cv")}>{ar ? "عرض السيرة الذاتية" : "View Professional Profile"}</a>
          </div>
          <div className="experience-points">
            {(ar
              ? ["التسويق الرقمي", "تطوير الأعمال", "التدريب والاستشارات", "التخطيط الاستراتيجي", "تصميم المواقع", "الحملات الإعلانية", "التصميم الجرافيكي", "إدارة المشاريع", "التجارة الدولية"]
              : ["Digital Marketing", "Business Development", "Training and Consulting", "Strategic Planning", "Website Design", "Advertising Campaigns", "Graphic Design", "Project Management", "International Trade"]
            ).map((item) => (
              <span className="experience-chip" key={item}><CheckCircle2 size={17} aria-hidden />{item}</span>
            ))}
          </div>
        </div>
      </section>}

      {sectionState(homepageMeta, "services").visible && <section className="section signature-services-section" style={{ order: sectionState(homepageMeta, "services").order }}>
        <div className="container">
          <SectionHeader eyebrow={ar ? "خدماتنا" : "Services"} title={ar ? "كل ما يحتاجه مشروعك للنجاح" : "Everything Your Project Needs to Succeed"}>
            {ar ? "تسع خدمات متكاملة مصممة خصيصاً لتناسب رؤيتك." : "Integrated services tailored to fit your goals and growth stage."}
          </SectionHeader>
          <div className="signature-services-grid">
            {services.slice(0, 5).map((service, index) => {
              const Icon = service.icon;
              const featured = index === 0;
              return (
                <article className={featured ? "signature-service-card signature-service-card-featured" : "signature-service-card"} key={service.slug}>
                  <div className="signature-service-topline">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div className="signature-icon"><Icon size={featured ? 28 : 22} /></div>
                  </div>
                  <div className="signature-service-copy">
                    <h3 className={featured ? "h2" : "h3"}>{service.title[locale]}</h3>
                    <p>{service.description[locale]}</p>
                  </div>
                  <a className="text-link" href={withLocale(locale, service.detailHref ?? `/services/${service.slug}`)}><Arrow size={18} aria-hidden /> {ar ? "استكشف الخدمة" : "Explore Service"}</a>
                </article>
              );
            })}
          </div>
        </div>
      </section>}

      {sectionState(homepageMeta, "stats").visible && <section className="section band" style={{ order: sectionState(homepageMeta, "stats").order }}>
        <div className="container grid stat-grid">
          {person.metrics.map((metric) => <div className="card stat" key={metric.value}><AnimatedMetric value={metric.value} /><span>{metric.label[locale]}</span></div>)}
        </div>
      </section>}

      {sectionState(homepageMeta, "training").visible && <section className="section" style={{ order: sectionState(homepageMeta, "training").order }}>
        <div className="container">
          <SectionHeader eyebrow={ar ? "الدورات الخاصة" : "Private Courses"} title={ar ? "تعلم التسويق والتصميم بمنهجية عملية" : "Learn Marketing and Design Through Practice"}>
            {ar ? "برامج تدريبية واضحة تجمع بين المعرفة والتطبيق العملي." : "Structured training programs that connect knowledge with real execution."}
          </SectionHeader>
          <div className="grid portfolio-grid">
            {trainingCourses.map((project) => (
              <article className="card project" key={project.slug}>
                <div className="project-media">{project.image ? <Image src={project.image} alt={("imageAlt" in project ? project.imageAlt?.[locale] : "") || project.title[locale]} fill sizes="(max-width: 760px) 100vw, 50vw" /> : <span>{project.title[locale].slice(0, 2)}</span>}</div>
                <div className="project-body">
                  <p className="eyebrow">{projectCategoryLabels[locale][project.category as keyof typeof projectCategoryLabels.en]} · {project.year}</p>
                  <h3 className="h3">{project.title[locale]}</h3>
                  <p className="muted">{project.description[locale]}</p>
                  <a className="text-link" href={withLocale(locale, `/training/${project.slug}`)}><Arrow size={18} aria-hidden /> {ar ? "عرض البرنامج" : "View Program"}</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>}

      {sectionState(homepageMeta, "expertise").visible && <section className="section band" style={{ order: sectionState(homepageMeta, "expertise").order }}>
        <div className="container split">
          <div>
            <p className="eyebrow">{ar ? "خبرة عملية" : "Practical Expertise"}</p>
            <h2 className="h2">{ar ? "استراتيجيات تسويقية فعالة وأداء رقمي قابل للقياس" : "Effective Marketing Strategies and Measurable Digital Performance"}</h2>
          </div>
          <div className="grid">
            {(ar
              ? ["تحسين موقعك وأدائك الرقمي", "تحسين محركات البحث", "تسويق B2B والتصدير", "أدوات الذكاء الاصطناعي لتسريع أعمالك"]
              : ["Digital performance improvement", "Search engine optimization", "B2B marketing and export", "AI tools for business acceleration"]
            ).map((item) => <div className="check-item" key={item}><CheckCircle2 color="var(--brand-accent)" /><span>{item}</span></div>)}
          </div>
        </div>
      </section>}

      {sectionState(homepageMeta, "insights").visible && <div style={{ order: sectionState(homepageMeta, "insights").order }}><HomeInsightsSection locale={locale} cmsItems={cmsItems} homepageMeta={homepageMeta} /></div>}

      {sectionState(homepageMeta, "cta").visible && <section className="section" style={{ order: sectionState(homepageMeta, "cta").order }}>
        <div className="container cta">
          <div>
            <h2 className="h2">{ar ? "مستعد ترفع مستوى مشروعك؟" : "Ready to Raise Your Project Level?"}</h2>
            <p className="lead">{ar ? "لا تدع منافسيك يتقدمون عليك — تواصل معنا الآن عبر واتساب واحصل على استشارة مجانية." : "Start with a practical conversation and a clear next step."}</p>
          </div>
          <div className="hero-actions">
            <WhatsAppLink>{ar ? "تواصل عبر واتساب" : "WhatsApp"}</WhatsAppLink>
            <a className="btn btn-secondary" href={withLocale(locale, "/contact")}>{c.contact}</a>
          </div>
        </div>
      </section>}
    </div>
  );
}


