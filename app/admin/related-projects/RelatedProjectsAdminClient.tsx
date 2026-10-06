"use client";

import { useMemo, useState } from "react";
import type { CmsContentItem, CmsRole } from "@/lib/cms/types";

type Props = {
  projects: CmsContentItem[];
  homepage: CmsContentItem | null;
  role: CmsRole;
};

type RelatedConfig = {
  slug: string;
  image?: string;
  href?: string;
};

function readSettings(homepage: CmsContentItem | null) {
  const meta = (homepage?.meta ?? {}) as Record<string, unknown>;
  const slugs = Array.isArray(meta.relatedProjectSlugs)
    ? meta.relatedProjectSlugs.filter((v): v is string => typeof v === "string")
    : [];
  const rawConfig = meta.relatedProjectConfig && typeof meta.relatedProjectConfig === "object"
    ? meta.relatedProjectConfig as Record<string, unknown>
    : {};
  const config: Record<string, RelatedConfig> = {};
  for (const [slug, value] of Object.entries(rawConfig)) {
    if (value && typeof value === "object") {
      const item = value as Record<string, unknown>;
      config[slug] = {
        slug,
        image: typeof item.image === "string" ? item.image : "",
        href: typeof item.href === "string" ? item.href : ""
      };
    }
  }
  const heading = meta.relatedProjectsHeading && typeof meta.relatedProjectsHeading === "object"
    ? meta.relatedProjectsHeading as Record<string, unknown>
    : {};
  return {
    visible: !Array.isArray(meta.homeSections) || (meta.homeSections as Record<string, unknown>[]).find(s => s.key === "relatedProjects")?.visible !== false,
    ar: typeof heading.ar === "string" ? heading.ar : "المشاريع ذات الصلة",
    en: typeof heading.en === "string" ? heading.en : "Related Projects",
    autoPlay: meta.relatedProjectsAutoPlay !== false,
    interval: typeof meta.relatedProjectsInterval === "number" ? Math.max(3, Math.min(60, meta.relatedProjectsInterval)) : 8,
    slugs,
    config
  };
}

export function RelatedProjectsAdminClient({ projects, homepage, role }: Props) {
  const initial = useMemo(() => readSettings(homepage), [homepage]);
  const [visible, setVisible] = useState(initial.visible);
  const [ar, setAr] = useState(initial.ar);
  const [en, setEn] = useState(initial.en);
  const [autoPlay, setAutoPlay] = useState(initial.autoPlay);
  const [interval, setIntervalValue] = useState(initial.interval);
  const [selected, setSelected] = useState<string[]>(initial.slugs.length ? initial.slugs : projects.map(p => p.slug));
  const [config, setConfig] = useState<Record<string, RelatedConfig>>(initial.config);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function toggle(slug: string) {
    setSelected(current => current.includes(slug) ? current.filter(s => s !== slug) : [...current, slug]);
  }
  function move(slug: string, direction: -1 | 1) {
    setSelected(current => {
      const index = current.indexOf(slug);
      if (index < 0) return current;
      const next = index + direction;
      if (next < 0 || next >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  }
  function updateConfig(slug: string, field: "image" | "href", value: string) {
    setConfig(current => ({ ...current, [slug]: { ...(current[slug] ?? { slug }), slug, [field]: value } }));
  }

  async function save() {
    if (role !== "admin" && role !== "editor") return;
    setBusy(true); setMessage("");
    const ordered = selected;
    const relatedProjectConfig = Object.fromEntries(
      ordered.map(slug => [slug, {
        image: config[slug]?.image || "",
        href: config[slug]?.href || ""
      }])
    );
    const response = await fetch("/api/admin/related-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visible, titleAr: ar, titleEn: en, autoPlay, interval,
        relatedProjectSlugs: ordered,
        relatedProjectConfig
      })
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? "تم حفظ إعدادات المشاريع ذات الصلة بنجاح." : (data.message || "تعذر الحفظ."));
  }

  return (
    <div className="admin-content-layout">
      <section className="admin-card admin-list-panel">
        <div className="admin-card-head">
          <div>
            <h2>إعدادات القسم</h2>
            <p className="muted">هذه الإعدادات مرتبطة مباشرة بالسلايدر الموجود في الصفحة الرئيسية.</p>
          </div>
          <label className="admin-switch-row">
            <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} />
            <span>إظهار القسم</span>
          </label>
        </div>

        <div className="admin-form">
          <div className="admin-form-row">
            <label>العنوان بالعربية<input value={ar} onChange={e => setAr(e.target.value)} /></label>
            <label dir="ltr">English title<input value={en} onChange={e => setEn(e.target.value)} /></label>
          </div>
          <div className="admin-form-row">
            <label className="admin-switch-row">
              <input type="checkbox" checked={autoPlay} onChange={e => setAutoPlay(e.target.checked)} />
              <span>تشغيل تلقائي للسلايدر</span>
            </label>
            <label>الفاصل بالثواني<input type="number" min={3} max={60} value={interval} onChange={e => setIntervalValue(Number(e.target.value))} /></label>
          </div>
        </div>
      </section>

      <section className="admin-card admin-list-panel">
        <div className="admin-card-head">
          <div>
            <h2>المشاريع</h2>
            <p className="muted">اختر المشاريع التي تظهر في السلايدر وحدد ترتيبها وصورتها ورابطها.</p>
          </div>
          <span className="admin-status published">{selected.length} محدد</span>
        </div>

        <div className="admin-table-wrap">
          <table>
            <thead><tr><th>ظهور</th><th>المشروع</th><th>الصورة / الشعار</th><th>الرابط</th><th>الترتيب</th></tr></thead>
            <tbody>
              {projects.map(project => {
                const checked = selected.includes(project.slug);
                const image = config[project.slug]?.image || (typeof project.meta?.image === "string" ? project.meta.image : "");
                const href = config[project.slug]?.href || (typeof project.meta?.projectUrl === "string" ? project.meta.projectUrl : typeof project.meta?.websiteUrl === "string" ? project.meta.websiteUrl : typeof project.meta?.url === "string" ? project.meta.url : "");
                return (
                  <tr key={project.slug}>
                    <td><input type="checkbox" checked={checked} onChange={() => toggle(project.slug)} /></td>
                    <td><strong>{project.titleAr || project.titleEn}</strong><small>{project.slug}</small></td>
                    <td><input dir="ltr" value={image} onChange={e => updateConfig(project.slug, "image", e.target.value)} placeholder="رابط الصورة أو الشعار" /></td>
                    <td><input dir="ltr" value={href} onChange={e => updateConfig(project.slug, "href", e.target.value)} placeholder="https://..." /></td>
                    <td>
                      <div className="admin-actions">
                        <button type="button" disabled={!checked} onClick={() => move(project.slug, -1)}>↑</button>
                        <button type="button" disabled={!checked} onClick={() => move(project.slug, 1)}>↓</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!projects.length && <tr><td colSpan={5} className="admin-empty">لا توجد مشاريع في المحتوى.</td></tr>}
            </tbody>
          </table>
        </div>

        {message && <p className="admin-message">{message}</p>}
        <button className="admin-primary-button" disabled={busy} onClick={save}>{busy ? "جار الحفظ..." : "حفظ إعدادات المشاريع ذات الصلة"}</button>
      </section>
    </div>
  );
}
