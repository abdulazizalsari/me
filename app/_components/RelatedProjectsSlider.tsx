"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type RelatedProject = {
  slug: string;
  title: string;
  image: string;
  href?: string;
};

function columnsForWidth(width: number) {
  if (width < 700) return 1;
  if (width < 1024) return 2;
  return 3;
}

export function RelatedProjectsSlider({
  projects,
  title,
  locale
}: {
  projects: RelatedProject[];
  title: string;
  locale: "ar" | "en";
}) {
  const [columns, setColumns] = useState(3);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const update = () => setColumns(columnsForWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  const pages = useMemo(() => {
    const result: RelatedProject[][] = [];
    for (let i = 0; i < projects.length; i += columns) result.push(projects.slice(i, i + columns));
    return result.length ? result : [[]];
  }, [columns, projects]);

  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  const current = pages[page] ?? [];
  const canNavigate = pages.length > 1;
  const prev = () => setPage((p) => (p - 1 + pages.length) % pages.length);
  const next = () => setPage((p) => (p + 1) % pages.length);

  if (!projects.length) return null;

  return (
    <section className="related-projects-slider" aria-labelledby="related-projects-title">
      <div className="container">
        <div className="related-projects-heading">
          <h2 id="related-projects-title">{title}</h2>
        </div>

        <div className="related-projects-shell">
          <button
            type="button"
            className="related-projects-arrow related-projects-arrow-prev"
            onClick={prev}
            aria-label={locale === "ar" ? "المشاريع السابقة" : "Previous projects"}
            disabled={!canNavigate}
          >
            {locale === "ar" ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
          </button>

          <div className="related-projects-viewport">
            <div
              className="related-projects-page"
              data-count={current.length}
              style={{ "--project-columns": columns } as React.CSSProperties}
            >
              {current.map((project) => {
                const content = (
                  <>
                    <span className="related-projects-logo">
                      {project.image ? (
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          sizes="(max-width: 699px) 72vw, (max-width: 1023px) 38vw, 24vw"
                        />
                      ) : (
                        <span className="related-projects-fallback">{project.title.slice(0, 2)}</span>
                      )}
                    </span>
                    <strong>{project.title}</strong>
                  </>
                );

                return project.href ? (
                  <a className="related-project-card" href={project.href} key={project.slug}>
                    {content}
                  </a>
                ) : (
                  <article className="related-project-card" key={project.slug}>
                    {content}
                  </article>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="related-projects-arrow related-projects-arrow-next"
            onClick={next}
            aria-label={locale === "ar" ? "المشاريع التالية" : "Next projects"}
            disabled={!canNavigate}
          >
            {locale === "ar" ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
          </button>
        </div>

        {pages.length > 1 && (
          <div className="related-projects-pagination" aria-label={locale === "ar" ? "صفحات المشاريع" : "Project pages"}>
            {pages.map((_, index) => (
              <button
                type="button"
                key={index}
                className={index === page ? "active" : ""}
                aria-label={locale === "ar" ? `الصفحة ${index + 1}` : `Page ${index + 1}`}
                aria-current={index === page ? "page" : undefined}
                onClick={() => setPage(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
