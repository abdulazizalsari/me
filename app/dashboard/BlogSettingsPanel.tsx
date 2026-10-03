"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { CmsContentItem, CmsMediaAsset } from "@/lib/cms/types";
import { blogSettingsFromItems, defaultBlogSettings, taxonomySlug, type BlogTaxonomyItem } from "@/lib/cms/blog";

function blankTaxonomy(): BlogTaxonomyItem {
  return { slug: "", nameAr: "", nameEn: "", descriptionAr: "", descriptionEn: "", enabled: true, sortOrder: 100 };
}

export function BlogSettingsPanel({ initialItem, media }: { initialItem?: CmsContentItem | null; media: CmsMediaAsset[] }) {
  const initial = useMemo(() => blogSettingsFromItems(initialItem ? [initialItem] : []), [initialItem]);
  const [settings, setSettings] = useState(initial);
  const [id, setId] = useState(initialItem?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function patch(key: keyof typeof settings, value: unknown) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updateTaxonomy(kind: "categories" | "tags", index: number, next: Partial<BlogTaxonomyItem>) {
    setSettings((current) => ({
      ...current,
      [kind]: current[kind].map((item, itemIndex) => itemIndex === index ? { ...item, ...next } : item)
    }));
  }

  function addTaxonomy(kind: "categories" | "tags") {
    setSettings((current) => ({ ...current, [kind]: [...current[kind], { ...blankTaxonomy(), sortOrder: (current[kind].length + 1) * 10 }] }));
  }

  function removeTaxonomy(kind: "categories" | "tags", index: number) {
    setSettings((current) => ({ ...current, [kind]: current[kind].filter((_, itemIndex) => itemIndex !== index) }));
  }

  async function save() {
    setBusy(true);
    setMessage("جار حفظ إعدادات المدونة...");
    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id || undefined,
        type: "blog-settings",
        slug: "blog-settings",
        titleAr: settings.titleAr || defaultBlogSettings.titleAr,
        titleEn: settings.titleEn || defaultBlogSettings.titleEn,
        summaryAr: settings.introAr,
        summaryEn: settings.introEn,
        bodyAr: "",
        bodyEn: "",
        category: "",
        status: "published",
        sortOrder: 0,
        meta: settings
      })
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.item) {
      setMessage(data.message ?? "تعذر حفظ إعدادات المدونة.");
      return;
    }
    setId(data.item.id);
    setMessage("تم حفظ إعدادات المدونة.");
  }

  function TaxonomyEditor({ kind, title }: { kind: "categories" | "tags"; title: string }) {
    return (
      <div className="cms-section-settings">
        <div className="panel-heading">
          <div><h3>{title}</h3><p>إدارة مركزية بدون إنشاء نظام منفصل عن المقالات.</p></div>
          <button className="cms-ghost-button" type="button" onClick={() => addTaxonomy(kind)}><Plus size={16} /> إضافة</button>
        </div>
        <div className="cms-taxonomy-editor">
          {settings[kind].map((item, index) => (
            <div className="cms-taxonomy-row" key={`${kind}-${index}`}>
              <label>الاسم بالعربية<input value={item.nameAr} onChange={(event) => updateTaxonomy(kind, index, { nameAr: event.target.value, slug: item.slug || taxonomySlug(event.target.value) })} /></label>
              <label dir="ltr">English name<input dir="ltr" value={item.nameEn} onChange={(event) => updateTaxonomy(kind, index, { nameEn: event.target.value })} /></label>
              <label>Slug<input dir="ltr" value={item.slug} onChange={(event) => updateTaxonomy(kind, index, { slug: taxonomySlug(event.target.value) })} /></label>
              <label>الترتيب<input type="number" value={item.sortOrder ?? 0} onChange={(event) => updateTaxonomy(kind, index, { sortOrder: Number(event.target.value) })} /></label>
              <label className="cms-check"><input type="checkbox" checked={item.enabled !== false} onChange={(event) => updateTaxonomy(kind, index, { enabled: event.target.checked })} /> مفعّل</label>
              <button className="cms-row-actions" type="button" onClick={() => removeTaxonomy(kind, index)}><Trash2 size={15} /> حذف</button>
            </div>
          ))}
          {!settings[kind].length && <p className="cms-form-note">لا توجد عناصر بعد. يمكنك الإضافة الآن أو ترك النظام يستخرجها من المقالات الحالية.</p>}
        </div>
      </div>
    );
  }

  return (
    <section className="dashboard-panel cms-panel cms-blog-settings">
      <div className="panel-heading">
        <div><h2>إعدادات المدونة</h2><p>تحكم مركزي بصفحة رؤى وصفحة المقال بدون تعديل ملفات البرمجة.</p></div>
        <button className="dashboard-primary" type="button" disabled={busy} onClick={() => void save()}><Save size={17} /> {busy ? "جار الحفظ..." : "حفظ الإعدادات"}</button>
      </div>

      {message && <div className="cms-message">{message}</div>}

      <div className="cms-section-settings">
        <div className="panel-heading"><div><h3>صفحة رؤى</h3><p>عنوان وتعريف صفحة المدونة.</p></div></div>
        <div className="cms-form-row">
          <label>العنوان العربي<input value={settings.titleAr} onChange={(event) => patch("titleAr", event.target.value)} /></label>
          <label dir="ltr">English title<input dir="ltr" value={settings.titleEn} onChange={(event) => patch("titleEn", event.target.value)} /></label>
        </div>
        <div className="cms-form-row">
          <label>الوصف العربي<textarea rows={3} value={settings.introAr} onChange={(event) => patch("introAr", event.target.value)} /></label>
          <label dir="ltr">English description<textarea dir="ltr" rows={3} value={settings.introEn} onChange={(event) => patch("introEn", event.target.value)} /></label>
        </div>
      </div>

      <div className="cms-section-settings">
        <div className="panel-heading"><div><h3>عرض المقالات</h3><p>إظهار أو إخفاء العناصر مع الحفاظ على تصميم الموقع الحالي.</p></div></div>
        <div className="cms-form-row">
          <label>عدد المقالات في الصفحة<input type="number" min="1" max="30" value={settings.articlesPerPage} onChange={(event) => patch("articlesPerPage", Number(event.target.value))} /></label>
          <label>الصورة الافتراضية<select value={settings.defaultImageAssetId} onChange={(event) => patch("defaultImageAssetId", event.target.value)}><option value="">استخدام الصورة الافتراضية الحالية</option>{media.map((asset) => <option value={asset.id} key={asset.id}>{asset.filename}</option>)}</select></label>
        </div>
        <div className="cms-check-grid">
          {([
            ["showExcerpt", "إظهار الملخص"],
            ["showAuthor", "إظهار الكاتب"],
            ["showDate", "إظهار التاريخ"],
            ["showReadingTime", "إظهار وقت القراءة"],
            ["showShare", "إظهار المشاركة"],
            ["showRelated", "إظهار المقالات المرتبطة"],
            ["showToc", "جدول المحتويات"],
            ["showFeatured", "قسم المقال المميز"],
            ["showImportant", "قسم أهم المقالات"],
            ["showCategories", "التصنيفات"],
            ["showSearch", "بحث المقالات"]
          ] as const).map(([key, label]) => (
            <label className="cms-check" key={key}><input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => patch(key, event.target.checked)} /> {label}</label>
          ))}
        </div>
      </div>

      <div className="cms-section-settings">
        <div className="panel-heading"><div><h3>CTA أسفل المقال</h3><p>دعوة موحدة قابلة للتعديل.</p></div></div>
        <div className="cms-form-row">
          <label>العنوان العربي<input value={settings.ctaTitleAr} onChange={(event) => patch("ctaTitleAr", event.target.value)} /></label>
          <label dir="ltr">English title<input dir="ltr" value={settings.ctaTitleEn} onChange={(event) => patch("ctaTitleEn", event.target.value)} /></label>
        </div>
        <label>الرابط<input dir="ltr" value={settings.ctaUrl} onChange={(event) => patch("ctaUrl", event.target.value)} placeholder="/consultation" /></label>
      </div>

      <TaxonomyEditor kind="categories" title="التصنيفات" />
      <TaxonomyEditor kind="tags" title="الوسوم" />
    </section>
  );
}
