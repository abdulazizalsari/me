import Image from "next/image";
import { Megaphone } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { SectionHeader } from "@/components/ui/SectionHeader";

type Insight = {
  slug: string;
  title: { ar: string; en: string };
  category: { ar: string; en: string };
  date: string;
  excerpt: { ar: string; en: string };
  image: string;
  imageAlt?: { ar: string; en: string };
};

type InsightsHomeSectionProps = {
  locale: Locale;
  articles: Insight[];
  heading?: string;
  description?: string;
  visible?: boolean;
  articleCount?: number;
  featuredSlug?: string;
  showTicker?: boolean;
  tickerCount?: number;
};

export function InsightsHomeSection({ locale, articles, heading, description, visible = true, articleCount = 5, featuredSlug, showTicker = true, tickerCount = 6 }: InsightsHomeSectionProps) {
  if (!visible || !articles.length) return null;
  const ar = locale === "ar";
  const count = Math.max(3, Math.min(articleCount, articles.length));
  const visibleArticles = articles.slice(0, count);
  const featured = visibleArticles.find((article) => article.slug === featuredSlug) ?? visibleArticles[0];
  const cards = visibleArticles.filter((article) => article.slug !== featured.slug).slice(0, 4);
  const tickerArticles = articles.slice(0, Math.max(1, Math.min(tickerCount, articles.length)));
  const tickerItems = [...tickerArticles, ...tickerArticles];

  return <section className="section home-insights" aria-labelledby="home-insights-title">
    <div className="container">
      {showTicker && <div className="insights-ticker" aria-label={ar ? "آخر المقالات" : "Latest articles"}>
        <div className="insights-ticker-label"><Megaphone size={16} aria-hidden="true" /><span>{ar ? "آخر المقالات" : "Latest articles"}</span></div>
        <div className="insights-ticker-window">
          <div className="insights-ticker-track">
            {tickerItems.map((article, index) => <a className="insights-ticker-item" href={withLocale(locale, `/ruaa/${article.slug}`)} key={`${article.slug}-${index}`}>{article.title[locale]}</a>)}
          </div>
        </div>
      </div>}

      <div className="home-insights-heading">
        <SectionHeader eyebrow={ar ? "رؤى وأفكار" : "Rūʼā / Insights"} title={heading || (ar ? "أحدث الرؤى والمقالات" : "Latest Insights & Articles")}>
          {description || (ar ? "مقالات عملية في التسويق الرقمي، تطوير الأعمال، التجارة الدولية، والاستراتيجية." : "Practical articles on digital marketing, business growth, international trade, and strategy.")}
        </SectionHeader>
        <a className="btn btn-secondary" href={withLocale(locale, "/ruaa")}>{ar ? "عرض جميع المقالات" : "View all articles"}</a>
      </div>

      <div className="home-insights-layout">
        <article className="home-insights-featured">
          <a className="home-insights-featured-media" href={withLocale(locale, `/ruaa/${featured.slug}`)} aria-label={featured.title[locale]}>
            <Image src={featured.image} alt={featured.imageAlt?.[locale] || featured.title[locale]} fill priority={false} sizes="(max-width: 900px) 100vw, 58vw" />
          </a>
          <div className="home-insights-featured-copy">
            <p className="insight-meta">{featured.category[locale]} · {featured.date}</p>
            <h3 className="h2"><a href={withLocale(locale, `/ruaa/${featured.slug}`)}>{featured.title[locale]}</a></h3>
            <p className="lead">{featured.excerpt[locale]}</p>
            <a className="text-link" href={withLocale(locale, `/ruaa/${featured.slug}`)}>{ar ? "متابعة القراءة" : "Continue reading"}</a>
          </div>
        </article>
        <div className="home-insights-cards">
          {cards.map((article) => <article className="card home-insight-card" key={article.slug}>
            <a className="home-insight-card-media" href={withLocale(locale, `/ruaa/${article.slug}`)} aria-label={article.title[locale]}><Image src={article.image} alt={article.imageAlt?.[locale] || article.title[locale]} fill sizes="(max-width: 760px) 100vw, 30vw" /></a>
            <div className="home-insight-card-copy"><p className="insight-meta">{article.category[locale]} · {article.date}</p><h4 className="h3"><a href={withLocale(locale, `/ruaa/${article.slug}`)}>{article.title[locale]}</a></h4><a className="text-link" href={withLocale(locale, `/ruaa/${article.slug}`)}>{ar ? "متابعة القراءة" : "Continue reading"}</a></div>
          </article>)}
        </div>
      </div>
    </div>
  </section>;
}
