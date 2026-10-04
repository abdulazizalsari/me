"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { InsightArticle } from "@/app/_components/InsightsBlog";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

function dateLabel(date: string, locale: Locale) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en-US", { day: "numeric", month: "short" }).format(value);
}

function readingMinutes(article: InsightArticle, locale: Locale) {
  const content = `${article.title[locale]} ${article.excerpt[locale]} ${article.body[locale]}`.trim();
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / (locale === "ar" ? 170 : 210)));
}

export function RotatingImportantArticles({
  locale,
  articles,
  visibleCount = 12,
  rotateSeconds = 12,
  autoRotate = true
}: {
  locale: Locale;
  articles: InsightArticle[];
  visibleCount?: number;
  rotateSeconds?: number;
  autoRotate?: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const ar = locale === "ar";
  const source = useMemo(() => articles.filter(Boolean), [articles]);

  useEffect(() => {
    if (!autoRotate || source.length <= visibleCount) return;
    const timer = window.setInterval(() => {
      setOffset((current) => (current + visibleCount) % source.length);
    }, Math.max(5, rotateSeconds) * 1000);
    return () => window.clearInterval(timer);
  }, [autoRotate, rotateSeconds, source.length, visibleCount]);

  const visible = useMemo(() => {
    if (!source.length) return [];
    if (source.length <= visibleCount) return source;
    return Array.from({ length: visibleCount }, (_, index) => source[(offset + index) % source.length]);
  }, [offset, source, visibleCount]);

  if (!visible.length) return null;

  return (
    <section className="blog-important-section" aria-labelledby="important-articles-title">
      <div className="container">
        <div className="blog-important-frame">
          <div className="blog-important-heading">
            <h2 id="important-articles-title">{ar ? "أهم المقالات" : "Important articles"}</h2>
            <span className="blog-important-line" />
          </div>
          <div className="blog-important-grid">
            {visible.map((article, index) => (
              <a
                className="blog-important-card"
                href={withLocale(locale, `/ruaa/${article.slug}`)}
                key={`${article.slug}-${offset}-${index}`}
              >
                <span className="blog-important-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="blog-important-image">
                  <Image src={article.image} alt={article.imageAlt?.[locale] || article.title[locale]} fill sizes="150px" />
                </span>
                <span className="blog-important-copy">
                  <strong>{article.title[locale]}</strong>
                  <small>{article.author} • {readingMinutes(article, locale)} {ar ? "دقائق قراءة" : "min read"} • {dateLabel(article.date, locale)}</small>
                  <em>{article.category[locale]}</em>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
