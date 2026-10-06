"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { InsightArticle } from "@/app/_components/InsightsBlog";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

function readingMinutes(article: InsightArticle, locale: Locale) {
  const content = `${article.title[locale]} ${article.excerpt[locale]} ${article.body[locale]}`.trim();
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / (locale === "ar" ? 170 : 210)));
}

function useStableSlots(articles: InsightArticle[], count: number, intervalSeconds: number, initialOffset = 0, rotate = true) {
  const source = useMemo(() => articles.filter(Boolean), [articles]);
  const [offset, setOffset] = useState(initialOffset);

  useEffect(() => {
    if (!rotate || source.length <= count) return;
    const timer = window.setInterval(() => {
      setOffset((current) => (current + count) % source.length);
    }, Math.max(5, intervalSeconds) * 1000);
    return () => window.clearInterval(timer);
  }, [count, intervalSeconds, source.length, rotate]);

  return useMemo(() => {
    if (!source.length) return [];
    return Array.from({ length: Math.min(count, Math.max(count, source.length)) }, (_, index) => source[(offset + index) % source.length]).slice(0, count);
  }, [count, offset, source]);
}

export function StableShowcaseSlots({
  locale,
  articles,
  intervalSeconds = 12
}: {
  locale: Locale;
  articles: InsightArticle[];
  intervalSeconds?: number;
}) {
  const ar = locale === "ar";
  const slots = useStableSlots(articles, 5, intervalSeconds, 0);
  const main = slots[0];
  const small = slots.slice(1, 5);
  if (!main) return null;

  return (
    <div className="blog-showcase-grid">
      <a className="blog-showcase-main" href={withLocale(locale, `/ruaa/${main.slug}`)}>
        <Image src={main.image} alt={main.imageAlt?.[locale] || main.title[locale]} fill priority sizes="(max-width: 900px) 100vw, 54vw" />
        <span className="blog-showcase-overlay" />
        <span className="blog-showcase-content">
          <em>{main.category[locale]}</em>
          <strong>{main.title[locale]}</strong>
          <small>{readingMinutes(main, locale)} {ar ? "دقائق قراءة" : "min read"}</small>
        </span>
      </a>
      <div className="blog-showcase-small-grid">
        {small.map((article, index) => (
          <a className="blog-showcase-small" href={withLocale(locale, `/ruaa/${article.slug}`)} key={`showcase-slot-${index}`}>
            <Image src={article.image} alt={article.imageAlt?.[locale] || article.title[locale]} fill sizes="(max-width: 900px) 50vw, 22vw" />
            <span className="blog-showcase-overlay" />
            <span className="blog-showcase-content">
              <em>{article.category[locale]}</em>
              <strong>{article.title[locale]}</strong>
              <small>{readingMinutes(article, locale)} {ar ? "دقائق قراءة" : "min read"}</small>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function StableLightArticleSlots({
  locale,
  articles,
  intervalSeconds = 12
}: {
  locale: Locale;
  articles: InsightArticle[];
  intervalSeconds?: number;
}) {
  const ar = locale === "ar";
  const slots = useStableSlots(articles, 4, intervalSeconds, 4, false);
  return (
    <div className="blog-reference-two-grid">
      {slots.map((article, index) => (
        <a className="blog-reference-two-card" href={withLocale(locale, `/ruaa/${article.slug}`)} key={`light-slot-${index}`}>
          <span className="blog-reference-two-media">
            <Image src={article.image} alt={article.imageAlt?.[locale] || article.title[locale]} fill sizes="(max-width: 760px) 42vw, 240px" />
          </span>
          <span className="blog-reference-two-copy">
            <em>{article.category[locale]}</em>
            <strong>{article.title[locale]}</strong>
            <small>{article.author} • {readingMinutes(article, locale)} {ar ? "دقائق قراءة" : "min read"}</small>
          </span>
        </a>
      ))}
    </div>
  );
}

export function StableDarkArticleSlots({
  locale,
  articles,
  intervalSeconds = 12
}: {
  locale: Locale;
  articles: InsightArticle[];
  intervalSeconds?: number;
}) {
  const ar = locale === "ar";
  const slots = useStableSlots(articles, 4, intervalSeconds, 8, false);
  return (
    <div className="blog-dark-card-grid">
      {slots.map((article, index) => (
        <a className="blog-dark-card" href={withLocale(locale, `/ruaa/${article.slug}`)} key={`dark-slot-${index}`}>
          <span className="blog-dark-card-media">
            <Image src={article.image} alt={article.imageAlt?.[locale] || article.title[locale]} fill sizes="(max-width: 760px) 100vw, 36vw" />
            <em>{article.category[locale]}</em>
          </span>
          <span className="blog-dark-card-copy">
            <strong>{article.title[locale]}</strong>
            <small>{article.author} • {readingMinutes(article, locale)} {ar ? "دقائق قراءة" : "min read"}</small>
            <i aria-hidden="true">←</i>
          </span>
        </a>
      ))}
    </div>
  );
}
