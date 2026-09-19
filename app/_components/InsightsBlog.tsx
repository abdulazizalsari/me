import Image from "next/image";
import { ArrowUpLeft, ArrowUpRight, CalendarDays, Clock3, Copy, Megaphone, Newspaper, Search, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { articles as staticArticles } from "@/data/articles";
import type { CmsContentItem } from "@/lib/cms/types";
import { cmsImage } from "@/lib/cms/media";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";

type LocalizedText = Record<Locale, string>;

export type InsightArticle = {
  slug: string;
  title: LocalizedText;
  category: LocalizedText;
  date: string;
  updatedAt?: string;
  excerpt: LocalizedText;
  body: LocalizedText;
  image: string;
  imageAlt?: LocalizedText;
  important: boolean;
  featured: boolean;
  priority: "normal" | "high" | "primary";
};

const placeholderImage = "/images/legacy/insights-placeholder.svg";
const pageSize = 6;

function fallbackImageForCategory(category: string) {
  const value = category.toLowerCase();
  if (value.includes("website") || value.includes("web") || value.includes("موقع")) return "/images/legacy/programming-background-collage.jpg";
  if (value.includes("trade") || value.includes("business") || value.includes("تجارة") || value.includes("أعمال")) return "/images/legacy/services-banner.webp";
  return placeholderImage;
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function publicItemsForLocale(items: CmsContentItem[], locale: Locale) {
  if (locale === "ar") return items;
  return items.filter((item) => item.titleEn.trim() && item.summaryEn.trim() && item.meta?.englishStatus === "published");
}

export function articleRows(cmsItems: CmsContentItem[]): InsightArticle[] {
  const rows = cmsItems.filter((item) => item.type === "article");
  if (!rows.length) {
    return staticArticles.map((item, index) => ({
      slug: item.slug,
      title: item.title,
      category: item.category,
      date: item.date,
      excerpt: item.excerpt,
      body: item.excerpt,
      image: fallbackImageForCategory(item.category.en),
      important: index < 2,
      featured: index === 0,
      priority: index === 0 ? "primary" : index < 2 ? "high" : "normal"
    }));
  }

  return rows.map((item) => {
    const image = cmsImage(item.meta, "imageAssetId", typeof item.meta?.image === "string" ? item.meta.image : fallbackImageForCategory(item.category || ""));
    return {
      slug: item.slug,
      title: { ar: item.titleAr, en: item.titleEn || item.titleAr },
      category: { ar: item.category || "رؤى", en: item.category || "Insights" },
      date: typeof item.meta?.date === "string" ? item.meta.date : item.updatedAt.slice(0, 10),
      updatedAt: item.updatedAt,
      excerpt: { ar: item.summaryAr, en: item.summaryEn || item.summaryAr },
      body: { ar: item.bodyAr || item.summaryAr, en: item.bodyEn || item.summaryEn || item.summaryAr },
      image: image.url || placeholderImage,
      imageAlt: { ar: image.altAr, en: image.altEn },
      important: Boolean(item.meta?.isImportant),
      featured: Boolean(item.meta?.isFeatured),
      priority: item.meta?.editorialPriority === "primary" ? "primary" : item.meta?.editorialPriority === "high" ? "high" : "normal"
    };
  });
}

function priorityScore(article: InsightArticle) {
  if (article.priority === "primary") return 30;
  if (article.priority === "high") return 20;
  return 0;
}

function byEditorialPriority(a: InsightArticle, b: InsightArticle) {
  const score = Number(b.important) * 100 + Number(b.featured) * 60 + priorityScore(b) - (Number(a.important) * 100 + Number(a.featured) * 60 + priorityScore(a));
  if (score) return score;
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function newestFirst(a: InsightArticle, b: InsightArticle) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function selectFeatured(articles: InsightArticle[], explicitSlug?: string) {
  return articles.find((article) => article.slug === explicitSlug)
    ?? [...articles].sort((a, b) => Number(b.featured) - Number(a.featured) || priorityScore(b) - priorityScore(a) || newestFirst(a, b))[0];
}

function selectImportant(articles: InsightArticle[], count = 6) {
  const important = articles.filter((article) => article.important).sort(byEditorialPriority);
  const featured = articles.filter((article) => article.featured && !important.some((item) => item.slug === article.slug)).sort(byEditorialPriority);
  const latest = articles.filter((article) => !important.some((item) => item.slug === article.slug) && !featured.some((item) => item.slug === article.slug)).sort(newestFirst);
  return [...important, ...featured, ...latest].slice(0, Math.max(1, count));
}

function dateLabel(date: string, locale: Locale) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en-US", { day: "numeric", month: "long", year: "numeric" }).format(value);
}

function readingMinutes(article: InsightArticle, locale: Locale) {
  const content = `${article.title[locale]} ${article.excerpt[locale]} ${article.body[locale]}`.trim();
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / (locale === "ar" ? 170 : 210)));
}

function queryString(input: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && String(value).trim()) params.set(key, String(value));
  });
  const value = params.toString();
  return value ? `?${value}` : "";
}

function localizedMetaText(value: unknown, locale: Locale) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const localized = (value as Partial<Record<Locale, unknown>>)[locale];
  return typeof localized === "string" ? localized : undefined;
}

function tickerSpeed(value: unknown): "slow" | "medium" {
  return value === "medium" ? "medium" : "slow";
}

function CardMeta({ article, locale }: { article: InsightArticle; locale: Locale }) {
  return <p className="insight-meta"><CalendarDays size={14} aria-hidden="true" />{dateLabel(article.date, locale)}</p>;
}

export function InsightsTicker({ locale, articles, label, count = 6, speed = "slow" }: { locale: Locale; articles: InsightArticle[]; label?: string; count?: number; speed?: "slow" | "medium" }) {
  const ar = locale === "ar";
  const items = selectImportant(articles, count);
  if (!items.length) return null;
  const repeated = [...items, ...items];
  return (
    <div className={`insights-ticker editorial-ticker ticker-${speed}`} aria-label={label || (ar ? "أهم المقالات" : "Important articles")}>
      <div className="insights-ticker-label"><Megaphone size={16} aria-hidden="true" /><span>{label || (ar ? "أهم المقالات" : "Important articles")}</span></div>
      <div className="insights-ticker-window">
        <div className="insights-ticker-track">
          {repeated.map((article, index) => (
            <a className="insights-ticker-item" href={withLocale(locale, `/ruaa/${article.slug}`)} key={`${article.slug}-${index}`}>
              {article.title[locale]}<span aria-hidden="true">•</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturedArticle({ article, locale, compact = false }: { article: InsightArticle; locale: Locale; compact?: boolean }) {
  const ar = locale === "ar";
  return (
    <article className={compact ? "featured-mini-story" : "featured-editorial-card"}>
      <a className="featured-editorial-media" href={withLocale(locale, `/ruaa/${article.slug}`)} aria-label={article.title[locale]}>
        <Image src={article.image} alt={article.imageAlt?.[locale] || article.title[locale]} fill priority={!compact} sizes={compact ? "(max-width: 760px) 100vw, 28vw" : "(max-width: 1024px) 100vw, 58vw"} />
        <span className="insight-card-category">{article.category[locale]}</span>
      </a>
      <div className="featured-editorial-copy">
        <CardMeta article={article} locale={locale} />
        <h2 className={compact ? "h3" : "h2"}><a href={withLocale(locale, `/ruaa/${article.slug}`)}>{article.title[locale]}</a></h2>
        {!compact && <p className="lead">{article.excerpt[locale]}</p>}
        <a className="text-link" href={withLocale(locale, `/ruaa/${article.slug}`)}>{ar ? "قراءة المقال" : "Read article"}</a>
      </div>
    </article>
  );
}

function StandardArticleCard({ article, locale, index = 0 }: { article: InsightArticle; locale: Locale; index?: number }) {
  const Arrow = locale === "ar" ? ArrowUpLeft : ArrowUpRight;
  return (
    <article className="card article-card insight-card editorial-card" style={{ "--reveal-index": index } as CSSProperties}>
      <a className="insight-card-media" href={withLocale(locale, `/ruaa/${article.slug}`)} aria-label={article.title[locale]}>
        <Image src={article.image} alt={article.imageAlt?.[locale] || article.title[locale]} fill sizes="(max-width: 760px) 100vw, 33vw" />
        <span className="insight-card-category">{article.category[locale]}</span>
      </a>
      <div className="insight-card-body">
        <CardMeta article={article} locale={locale} />
        <h3 className="h3"><a href={withLocale(locale, `/ruaa/${article.slug}`)}>{article.title[locale]}</a></h3>
        <p className="muted">{article.excerpt[locale]}</p>
        <a className="text-link" href={withLocale(locale, `/ruaa/${article.slug}`)}><Arrow size={17} aria-hidden="true" />{locale === "ar" ? "متابعة القراءة" : "Continue reading"}</a>
      </div>
    </article>
  );
}

function CompactArticle({ article, locale }: { article: InsightArticle; locale: Locale }) {
  return (
    <a className="compact-article" href={withLocale(locale, `/ruaa/${article.slug}`)}>
      <span className="compact-article-media"><Image src={article.image} alt={article.imageAlt?.[locale] || article.title[locale]} fill sizes="96px" /></span>
      <span className="compact-article-copy">
        <small>{article.category[locale]}</small>
        <strong>{article.title[locale]}</strong>
        <em>{dateLabel(article.date, locale)}</em>
      </span>
    </a>
  );
}

function HorizontalArticleCard({ article, locale, index = 0 }: { article: InsightArticle; locale: Locale; index?: number }) {
  return (
    <article className="horizontal-article-card" style={{ "--reveal-index": index } as CSSProperties}>
      <a className="horizontal-article-media" href={withLocale(locale, `/ruaa/${article.slug}`)} aria-label={article.title[locale]}>
        <Image src={article.image} alt={article.imageAlt?.[locale] || article.title[locale]} fill sizes="(max-width: 760px) 42vw, 260px" />
      </a>
      <div className="horizontal-article-copy">
        <span className="editorial-label">{article.category[locale]}</span>
        <h3 className="h3"><a href={withLocale(locale, `/ruaa/${article.slug}`)}>{article.title[locale]}</a></h3>
        <CardMeta article={article} locale={locale} />
        <p className="muted">{article.excerpt[locale]}</p>
      </div>
    </article>
  );
}

function CategoryNav({ locale, categories, activeCategory, query }: { locale: Locale; categories: string[]; activeCategory?: string; query?: string }) {
  const ar = locale === "ar";
  return (
    <nav className="insights-filter-list editorial-category-nav" aria-label={ar ? "تصنيفات المقالات" : "Article categories"}>
      <a className={!activeCategory ? "insights-filter active" : "insights-filter"} href={withLocale(locale, `/ruaa${queryString({ q: query })}`)}>{ar ? "الكل" : "All"}</a>
      {categories.map((category) => (
        <a className={activeCategory === category ? "insights-filter active" : "insights-filter"} href={withLocale(locale, `/ruaa${queryString({ category, q: query })}`)} key={category}>{category}</a>
      ))}
    </nav>
  );
}

function SearchBox({ locale, query, category }: { locale: Locale; query?: string; category?: string }) {
  const ar = locale === "ar";
  return (
    <form className="insights-search" action={withLocale(locale, "/ruaa")} role="search">
      {category && <input type="hidden" name="category" value={category} />}
      <label>
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">{ar ? "البحث في رؤى" : "Search insights"}</span>
        <input name="q" defaultValue={query} placeholder={ar ? "ابحث في رؤى..." : "Search insights..."} />
      </label>
      <button type="submit">{ar ? "بحث" : "Search"}</button>
    </form>
  );
}

function Pagination({ locale, currentPage, totalPages, category, query }: { locale: Locale; currentPage: number; totalPages: number; category?: string; query?: string }) {
  if (totalPages <= 1) return null;
  const ar = locale === "ar";
  return (
    <nav className="article-pagination" aria-label={ar ? "ترقيم المقالات" : "Article pagination"}>
      <a aria-disabled={currentPage <= 1} href={withLocale(locale, `/ruaa${queryString({ category, q: query, page: Math.max(1, currentPage - 1) })}`)}>{ar ? "السابق" : "Previous"}</a>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <a className={page === currentPage ? "active" : ""} aria-current={page === currentPage ? "page" : undefined} href={withLocale(locale, `/ruaa${queryString({ category, q: query, page })}`)} key={page}>{page}</a>
      ))}
      <a aria-disabled={currentPage >= totalPages} href={withLocale(locale, `/ruaa${queryString({ category, q: query, page: Math.min(totalPages, currentPage + 1) })}`)}>{ar ? "التالي" : "Next"}</a>
    </nav>
  );
}

function BlogSidebar({ locale, articles, categories }: { locale: Locale; articles: InsightArticle[]; categories: string[] }) {
  const ar = locale === "ar";
  const important = selectImportant(articles, 5);
  const latest = [...articles].sort(newestFirst).slice(0, 4);
  return (
    <aside className="insights-sidebar blog-sidebar" aria-label={ar ? "محتوى جانبي لرؤى" : "Insights sidebar"}>
      <section>
        <h2 className="h3"><Sparkles size={18} aria-hidden="true" />{ar ? "أهم المقالات" : "Important articles"}</h2>
        <div className="compact-list">{important.map((article) => <CompactArticle article={article} locale={locale} key={article.slug} />)}</div>
      </section>
      <section>
        <h2 className="h3"><Newspaper size={18} aria-hidden="true" />{ar ? "أحدث المقالات" : "Latest articles"}</h2>
        <div className="compact-list">{latest.map((article) => <CompactArticle article={article} locale={locale} key={article.slug} />)}</div>
      </section>
      <section>
        <h2 className="h3">{ar ? "التصنيفات" : "Categories"}</h2>
        {categories.map((category, index) => <a className="insights-topic" href={withLocale(locale, `/ruaa${queryString({ category })}`)} key={category}><span>{String(index + 1).padStart(2, "0")}</span>{category}</a>)}
      </section>
      <section className="sidebar-cta">
        <h2 className="h3">{ar ? "حوّل الفكرة إلى خطة" : "Turn insight into a plan"}</h2>
        <p>{ar ? "ابدأ باستشارة قصيرة لفهم الطريق العملي الأنسب." : "Start with a short consultation to clarify the practical path."}</p>
        <a className="btn btn-primary" href={withLocale(locale, "/consultation")}>{ar ? "اطلب استشارة" : "Book a consultation"}</a>
      </section>
    </aside>
  );
}

export function HomeInsightsSection({ locale, cmsItems, homepageMeta }: { locale: Locale; cmsItems: CmsContentItem[]; homepageMeta?: Record<string, unknown> }) {
  const ar = locale === "ar";
  if (homepageMeta?.insightsVisible === false) return null;
  const articles = articleRows(publicItemsForLocale(cmsItems, locale));
  if (!articles.length) return null;
  const count = typeof homepageMeta?.insightsArticleCount === "number" ? homepageMeta.insightsArticleCount : 3;
  const featured = selectFeatured(articles, typeof homepageMeta?.insightsFeaturedSlug === "string" ? homepageMeta.insightsFeaturedSlug : undefined);
  const pool = articles.filter((article) => article.slug !== featured?.slug).sort(byEditorialPriority).slice(0, Math.max(2, count - 1));
  const heading = localizedMetaText(homepageMeta?.insightsHeading, locale) || (ar ? "أحدث الرؤى والمقالات" : "Latest Insights & Articles");
  const description = localizedMetaText(homepageMeta?.insightsDescription, locale) || (ar ? "مقالات عملية في التسويق الرقمي، تطوير الأعمال، التجارة الدولية، الاستراتيجية، والتدريب." : "Practical articles on digital marketing, business development, international trade, strategy, and training.");
  const tickerLabel = localizedMetaText(homepageMeta?.insightsTickerLabel, locale) || (ar ? "أهم المقالات" : "Important articles");
  return (
    <section className="section home-insights editorial-home-insights" data-ticker-label={tickerLabel}>
      <div className="container">
        <div className="home-insights-heading">
          <div className="section-head">
            <div>
              <p className="eyebrow">{ar ? "رؤى وأفكار" : "Insights & Ideas"}</p>
              <h2 className="h2">{heading}</h2>
              <p>{description}</p>
            </div>
          </div>
          {homepageMeta?.insightsShowAllButton !== false && <a className="btn btn-secondary" href={withLocale(locale, "/ruaa")}>{ar ? "عرض جميع المقالات" : "View all articles"}</a>}
        </div>
        <div className="home-editorial-layout">
          {featured && <FeaturedArticle article={featured} locale={locale} />}
          <div className="home-editorial-side">
            {pool.slice(0, 4).map((article) => <CompactArticle article={article} locale={locale} key={article.slug} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

export function EditorialInsightsPage({ locale, cmsItems = [], searchParams = {} }: { locale: Locale; cmsItems?: CmsContentItem[]; searchParams?: Record<string, string | string[] | undefined> }) {
  const ar = locale === "ar";
  const allArticles = articleRows(publicItemsForLocale(cmsItems, locale));
  const categories = Array.from(new Set(allArticles.map((article) => article.category[locale]).filter(Boolean)));
  const activeCategory = asText(Array.isArray(searchParams.category) ? searchParams.category[0] : searchParams.category);
  const query = asText(Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q);
  const currentPage = Math.max(1, Number(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page) || 1);
  const searched = allArticles.filter((article) => {
    if (activeCategory && article.category[locale] !== activeCategory) return false;
    if (!query) return true;
    const haystack = `${article.title[locale]} ${article.excerpt[locale]} ${article.body[locale]} ${article.category[locale]}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
  const featured = selectFeatured(allArticles);
  const secondary = allArticles.filter((article) => article.slug !== featured?.slug).sort(byEditorialPriority).slice(0, 2);
  const latestPool = searched.filter((article) => article.slug !== featured?.slug).sort(newestFirst);
  const totalPages = Math.max(1, Math.ceil(latestPool.length / pageSize));
  const pageArticles = latestPool.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return (
    <>
      <section className="insights-editorial-hero">
        <div className="container">
          <p className="eyebrow"><Newspaper size={17} aria-hidden="true" />{ar ? "رؤى" : "Insights"}</p>
          <h1 className="h1">{ar ? "رؤى عملية للأعمال والعالم الرقمي" : "Practical Insights for Business and the Digital World"}</h1>
          <p className="lead">{ar ? "مقالات وتحليلات وأفكار عملية في التسويق الرقمي، تطوير الأعمال، التجارة الدولية، الاستراتيجية، والتدريب." : "Practical articles, analysis, and ideas on digital marketing, business development, international trade, strategy, and training."}</p>
          <CategoryNav locale={locale} categories={categories} activeCategory={activeCategory} query={query} />
        </div>
      </section>
      <section className="section insights-section blog-home" aria-labelledby="latest-insights-title">
        <div className="container">
          <InsightsTicker locale={locale} articles={allArticles} count={6} />
          <div className="featured-stories-grid">
            {featured && <FeaturedArticle article={featured} locale={locale} />}
            <div className="secondary-stories">
              {secondary.map((article) => <FeaturedArticle article={article} locale={locale} compact key={article.slug} />)}
            </div>
          </div>
          <div className="insights-layout editorial-blog-layout" id="article-grid">
            <main className="blog-main">
              <div className="blog-section-heading">
                <div>
                  <p className="eyebrow">{ar ? "أحدث المقالات" : "Latest articles"}</p>
                  <h2 className="h2" id="latest-insights-title">{activeCategory || query ? (ar ? "نتائج التصفح" : "Browsing results") : (ar ? "أحدث المقالات" : "Latest articles")}</h2>
                </div>
                <SearchBox locale={locale} query={query} category={activeCategory} />
              </div>
              <div className="latest-articles-grid">
                {pageArticles.map((article, index) => index % 3 === 0 ? <HorizontalArticleCard article={article} locale={locale} index={index} key={article.slug} /> : <StandardArticleCard article={article} locale={locale} index={index} key={article.slug} />)}
              </div>
              {!pageArticles.length && <div className="empty-blog-state">{ar ? "لا توجد مقالات مطابقة حالياً." : "No matching articles yet."}</div>}
              <Pagination locale={locale} currentPage={currentPage} totalPages={totalPages} category={activeCategory} query={query} />
            </main>
            <BlogSidebar locale={locale} articles={allArticles} categories={categories} />
          </div>
        </div>
      </section>
    </>
  );
}

function bodyBlocks(content: string) {
  return content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
}

function headingId(text: string) {
  return text.toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-|-$/g, "");
}

function ArticleContent({ content }: { content: string }) {
  const blocks = bodyBlocks(content);
  return (
    <>
      {blocks.map((block, index) => {
        if (block.startsWith("### ")) {
          const text = block.replace(/^###\s+/, "");
          return <h3 id={headingId(text)} key={index}>{text}</h3>;
        }
        if (block.startsWith("## ")) {
          const text = block.replace(/^##\s+/, "");
          return <h2 id={headingId(text)} key={index}>{text}</h2>;
        }
        if (block.startsWith("> ")) return <blockquote key={index}>{block.replace(/^>\s*/, "")}</blockquote>;
        if (block.split("\n").every((line) => line.trim().startsWith("- "))) return <ul key={index}>{block.split("\n").map((line) => <li key={line}>{line.replace(/^-\s*/, "")}</li>)}</ul>;
        return <p key={index}>{block}</p>;
      })}
    </>
  );
}

function TableOfContents({ content, locale }: { content: string; locale: Locale }) {
  const headings = bodyBlocks(content).filter((block) => /^#{2,3}\s+/.test(block)).map((block) => block.replace(/^#{2,3}\s+/, ""));
  if (headings.length < 3) return null;
  return (
    <nav className="article-toc" aria-label={locale === "ar" ? "محتويات المقال" : "Article contents"}>
      <strong>{locale === "ar" ? "محتويات المقال" : "Article contents"}</strong>
      {headings.map((heading) => <a href={`#${headingId(heading)}`} key={heading}>{heading}</a>)}
    </nav>
  );
}

export function EditorialArticlePage({ locale, slug, cmsItems = [] }: { locale: Locale; slug: string; cmsItems?: CmsContentItem[] }) {
  const localizedCmsItems = publicItemsForLocale(cmsItems, locale);
  const allSourceArticles = articleRows(publicItemsForLocale(cmsItems, "ar"));
  if (locale === "en" && allSourceArticles.some((item) => item.slug === slug) && !localizedCmsItems.some((item) => item.type === "article" && item.slug === slug)) {
    notFound();
  }
  const articles = articleRows(localizedCmsItems);
  const article = articles.find((item) => item.slug === slug) || articles[0];
  if (!article) notFound();
  const ar = locale === "ar";
  const related = articles.filter((candidate) => candidate.slug !== article.slug && candidate.category[locale] === article.category[locale]).slice(0, 3);
  const important = selectImportant(articles, 4).filter((item) => item.slug !== article.slug);
  const minutes = readingMinutes(article, locale);
  return (
    <>
      <article className="article-publication">
        <div className="container">
          <nav className="article-breadcrumbs" aria-label={ar ? "مسار الصفحة" : "Breadcrumb"}>
            <a href={withLocale(locale, "/")}>{ar ? "الرئيسية" : "Home"}</a><span>/</span>
            <a href={withLocale(locale, "/ruaa")}>{ar ? "رؤى" : "Insights"}</a><span>/</span>
            <span>{article.title[locale]}</span>
          </nav>
          <header className="article-publication-header">
            <span className="editorial-label">{article.category[locale]}</span>
            <h1 className="h1">{article.title[locale]}</h1>
            <p className="lead">{article.excerpt[locale]}</p>
            <div className="article-meta-row">
              <span>{ar ? "عبدالعزيز الصاري" : "AbdulAziz Al-Sari"}</span>
              <span><CalendarDays size={15} aria-hidden="true" />{dateLabel(article.date, locale)}</span>
              <span><Clock3 size={15} aria-hidden="true" />{ar ? `${minutes} دقائق قراءة` : `${minutes} min read`}</span>
            </div>
          </header>
          <div className="article-featured-image">
            <Image src={article.image} alt={article.imageAlt?.[locale] || article.title[locale]} fill priority sizes="(max-width: 1024px) 100vw, 1120px" />
          </div>
          <div className="article-reading-layout">
            <aside className="article-reading-aside">
              <TableOfContents content={article.body[locale]} locale={locale} />
              <div className="article-share">
                <strong>{ar ? "مشاركة" : "Share"}</strong>
                <a href={`https://wa.me/?text=${encodeURIComponent(article.title[locale])}`} target="_blank" rel="noreferrer">WhatsApp</a>
                <button type="button"><Copy size={15} aria-hidden="true" />{ar ? "نسخ الرابط" : "Copy link"}</button>
              </div>
            </aside>
            <div className="article-body editorial-article-body">
              <ArticleContent content={article.body[locale] || article.excerpt[locale]} />
            </div>
          </div>
        </div>
      </article>
      <section className="section article-bottom-cta">
        <div className="container cta">
          <div>
            <p className="eyebrow">{ar ? "من الفكرة إلى التنفيذ" : "From idea to execution"}</p>
            <h2 className="h2">{ar ? "هل تريد تحويل الفكرة إلى خطة عملية؟" : "Want to turn the idea into a practical plan?"}</h2>
          </div>
          <a className="btn btn-primary" href={withLocale(locale, "/consultation")}>{ar ? "اطلب استشارة" : "Book a consultation"}</a>
        </div>
      </section>
      {related.length > 0 && (
        <section className="section related-articles" aria-labelledby="related-articles-title">
          <div className="container">
            <h2 className="h2" id="related-articles-title">{ar ? "مقالات ذات صلة" : "Related articles"}</h2>
            <div className="grid related-articles-grid">{related.map((item) => <StandardArticleCard article={item} locale={locale} key={item.slug} />)}</div>
          </div>
        </section>
      )}
      {important.length > 0 && (
        <section className="section band">
          <div className="container">
            <div className="blog-section-heading"><div><p className="eyebrow">{ar ? "أهم المقالات" : "Important articles"}</p><h2 className="h2">{ar ? "تابع القراءة" : "Keep reading"}</h2></div></div>
            <div className="compact-list compact-list-grid">{important.map((item) => <CompactArticle article={item} locale={locale} key={item.slug} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}

