"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type RandomPopupArticle = {
  slug: string;
  href: string;
  title: string;
  category: string;
  image: string;
  imageAlt: string;
  author: string;
  readingMinutes: number;
};

function pickDifferent(length: number, previous: number) {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  if (next === previous) next = (next + 1 + Math.floor(Math.random() * (length - 1))) % length;
  return next;
}

export function RandomArticlePopup({
  articles,
  locale,
  intervalSeconds = 12
}: {
  articles: RandomPopupArticle[];
  locale: "ar" | "en";
  intervalSeconds?: number;
}) {
  const pathname = usePathname();
  const ar = locale === "ar";
  const allowedPath = pathname === "/ruaa" || pathname === "/en/ruaa";
  const source = useMemo(() => articles.filter((article) => article.slug && article.href && article.title), [articles]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    setCurrentIndex(-1);
    if (!allowedPath || !source.length) return;

    const showRandomArticle = () => {
      setCurrentIndex((previous) => pickDifferent(source.length, previous));
      setVisible(true);
    };

    const timer = window.setInterval(showRandomArticle, Math.max(5, intervalSeconds) * 1000);
    return () => window.clearInterval(timer);
  }, [allowedPath, intervalSeconds, pathname, source.length]);

  if (!allowedPath || !visible || currentIndex < 0 || !source[currentIndex]) return null;

  const article = source[currentIndex];

  return (
    <aside className="random-article-popup" aria-label={ar ? "مقالة مقترحة" : "Suggested article"}>
      <button
        className="random-article-popup-close"
        type="button"
        aria-label={ar ? "إغلاق المقالة المقترحة" : "Close suggested article"}
        onClick={() => setVisible(false)}
      >
        ×
      </button>

      <a className="random-article-popup-link" href={article.href}>
        <span className="random-article-popup-copy">
          <small>{ar ? "مقالة مقترحة لك" : "Suggested for you"}</small>
          <strong>{article.title}</strong>
          <span>{article.category} · {article.readingMinutes} {ar ? "دقائق قراءة" : "min read"}</span>
          <em>{ar ? "اقرأ المقال ←" : "Read article →"}</em>
        </span>
        <span className="random-article-popup-media">
          <Image
            src={article.image}
            alt={article.imageAlt || article.title}
            fill
            sizes="110px"
          />
        </span>
      </a>
    </aside>
  );
}
