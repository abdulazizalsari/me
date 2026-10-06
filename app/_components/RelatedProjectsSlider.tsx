"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type RelatedProject = {
  slug: string;
  title: string;
  titleOverride?: string;
  image: string;
  href?: string;
  isProtected?: boolean;
  watermarkEnabled?: boolean;
};

function columnsForWidth(width: number) {
  if (width < 700) return 1;
  if (width < 1024) return 2;
  return 3;
}

export function RelatedProjectsSlider({
  projects,
  title,
  locale,
  autoPlay = true,
  autoPlayInterval = 8000,
  titleVisible = true,
  design
}: {
  projects: RelatedProject[];
  title: string;
  locale: "ar" | "en";
  autoPlay?: boolean;
  autoPlayInterval?: number;
  titleVisible?: boolean;
  design?: Record<string, unknown>;
}) {
  const [columns, setColumns] = useState(3);
  const [page, setPage] = useState(0);
  const showArrows = design?.showArrows !== false;
  const showDots = design?.showDots !== false;
  const configuredColumns = Math.max(1, Math.min(4, Number(design?.columns) || 3));
  const gap = Math.max(8, Math.min(48, Number(design?.gap) || 22));
  const radius = Math.max(0, Math.min(40, Number(design?.radius) || 22));
  const cardHeight = Math.max(180, Math.min(500, Number(design?.cardHeight) || 286));
  const transition = ["slide","fade","zoom"].includes(String(design?.transition)) ? String(design?.transition) : "slide";

  useEffect(() => {
    const update = () => setColumns(Math.min(configuredColumns, columnsForWidth(window.innerWidth)));
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, [configuredColumns]);

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

  useEffect(() => {
    if (!autoPlay || pages.length <= 1) return;
    const timer = window.setInterval(() => setPage((p) => (p + 1) % pages.length), Math.max(3000, autoPlayInterval));
    return () => window.clearInterval(timer);
  }, [autoPlay, autoPlayInterval, pages.length]);

  if (!projects.length) return null;

  return (
    <section className={`related-projects-slider related-projects-transition-${transition}`} aria-labelledby={titleVisible && title ? "related-projects-title" : undefined} style={{ "--related-gap": `${gap}px`, "--related-radius": `${radius}px`, "--related-card-height": `${cardHeight}px` } as CSSProperties}>
      <div className="container">
        {titleVisible && title ? <div className="related-projects-heading"><h2 id="related-projects-title">{title}</h2></div> : null}

        <div className={`related-projects-shell ${showArrows ? "" : "no-arrows"}`}>
          {showArrows ? <button
            type="button"
            className="related-projects-arrow related-projects-arrow-prev"
            onClick={prev}
            aria-label={locale === "ar" ? "المشاريع السابقة" : "Previous projects"}
            disabled={!canNavigate}
          >
            {locale === "ar" ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
          </button> : null}

          <div className="related-projects-viewport">
            <div
              className="related-projects-page"
              data-count={current.length}
              style={{ "--project-columns": columns } as CSSProperties}
            >
              {current.map((project) => {
                const content = (
                  <span className="related-projects-image-shell" onContextMenu={(event) => project.isProtected !== false && event.preventDefault()}>
                    {project.image ? (
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        draggable={project.isProtected === false}
                        sizes="(max-width: 699px) 72vw, (max-width: 1023px) 38vw, 24vw"
                        className="related-projects-image"
                      />
                    ) : (
                      <span className="related-projects-fallback">{project.title.slice(0, 2)}</span>
                    )}
                    {project.watermarkEnabled ? <span className="related-projects-watermark" aria-hidden="true">AbdulAziz Alsari</span> : null}
                  </span>
                );
                const cardContent = (
                  <>
                    <span className="related-projects-logo">
                      {content}
                    </span>
                    {project.titleOverride !== undefined ? <strong>{project.titleOverride}</strong> : <strong>{project.title}</strong>}
                  </>
                );

                return project.href ? (
                  <a className="related-project-card" href={project.href} key={project.slug}>
                    {cardContent}
                  </a>
                ) : (
                  <article className="related-project-card" key={project.slug}>
                    {cardContent}
                  </article>
                );
              })}
            </div>
          </div>

          {showArrows ? <button
            type="button"
            className="related-projects-arrow related-projects-arrow-next"
            onClick={next}
            aria-label={locale === "ar" ? "المشاريع التالية" : "Next projects"}
            disabled={!canNavigate}
          >
            {locale === "ar" ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
          </button> : null}
        </div>

        {showDots && pages.length > 1 && (
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
