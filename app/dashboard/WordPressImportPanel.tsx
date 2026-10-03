"use client";

import { FileArchive, Image as ImageIcon, UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState } from "react";

type DuplicateStrategy = "skip" | "update" | "copy";
type PreviewRow = {
  row: number;
  title: string;
  slug: string;
  status: string;
  category?: string;
  author?: string;
  date?: string;
  duplicate: boolean;
  valid: boolean;
  warnings: string[];
};
type ImportSummary = {
  rows: number;
  valid: number;
  invalid: number;
  existing: number;
  new: number;
  warnings: number;
  images?: number;
};
type ImportResult = {
  imported?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
  errors?: string[];
  imagesImported?: number;
  imagesFailed?: number;
  imageErrors?: string[];
};

export function WordPressImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [strategy, setStrategy] = useState<DuplicateStrategy>("skip");
  const [importImages, setImportImages] = useState(true);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function run(action: "preview" | "import") {
    if (!file) {
      setMessage("اختر ملف WordPress بصيغة WXR/XML أولاً.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("action", action);
    formData.append("duplicateStrategy", strategy);
    formData.append("importImages", String(importImages));

    setBusy(true);
    setMessage(action === "preview" ? "جار فحص ملف WordPress..." : "جار استيراد المقالات والصور...");
    setResult(null);

    try {
      const response = await fetch("/api/admin/articles/import-export", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        setMessage(data.message ?? "تعذر تنفيذ الاستيراد.");
        return;
      }

      if (action === "preview") {
        setSummary(data.summary ?? null);
        setPreview(Array.isArray(data.preview) ? data.preview : []);
        setMessage("تم فحص الملف. راجع النتائج ثم ابدأ الاستيراد.");
        return;
      }

      setResult(data.result ?? {});
      setMessage("اكتملت عملية الاستيراد.");
    } catch {
      setMessage("حدث خطأ أثناء الاتصال بخدمة الاستيراد.");
    } finally {
      setBusy(false);
    }
  }

  function resetForFile(nextFile: File | null) {
    setFile(nextFile);
    setPreview([]);
    setSummary(null);
    setResult(null);
    setMessage("");
  }

  return (
    <section className="dashboard-panel cms-panel cms-wordpress-import-page">
      <div className="panel-heading cms-wp-import-heading">
        <div>
          <p className="dashboard-kicker">نقل المحتوى</p>
          <h2>استيراد محتوى WordPress</h2>
          <p>انقل مقالات WordPress من ملف التصدير الرسمي WXR/XML مع الصور البارزة وصور المحتوى وبيانات المقال.</p>
        </div>
        <div className="cms-wp-import-icon"><FileArchive size={28} /></div>
      </div>

      <div className="cms-wp-import-notice">
        <strong>قبل الاستيراد</strong>
        <p>
          من WordPress افتح <b>أدوات ← تصدير ← كل المحتوى</b> ثم نزّل ملف XML. ارفعه هنا، وسيتم فحص المقالات أولاً قبل حفظ أي شيء.
          عند تفعيل نسخ الصور سيحاول النظام تنزيلها من الموقع القديم وحفظها داخل مكتبة وسائط موقعك الجديد.
        </p>
      </div>

      <div className="cms-wp-import-form">
        <label className="cms-wp-file-field">
          <span>ملف WXR / XML</span>
          <input
            type="file"
            accept=".xml,.wxr,application/xml,text/xml"
            onChange={(event) => resetForFile(event.target.files?.[0] ?? null)}
          />
          <div className="cms-wp-file-box">
            <UploadCloud size={30} />
            <strong>{file ? file.name : "اختر ملف WordPress"}</strong>
            <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "يدعم XML / WXR حتى 25MB"}</small>
          </div>
        </label>

        <div className="cms-form-row">
          <label>
            التعامل مع المقالات المكررة
            <select value={strategy} onChange={(event) => setStrategy(event.target.value as DuplicateStrategy)}>
              <option value="skip">تجاوز الموجود — الأكثر أماناً</option>
              <option value="update">تحديث المقال الموجود</option>
              <option value="copy">إنشاء نسخة جديدة</option>
            </select>
          </label>
          <label className="cms-check cms-wp-image-option">
            <input type="checkbox" checked={importImages} onChange={(event) => setImportImages(event.target.checked)} />
            <ImageIcon size={18} />
            <span><strong>نسخ الصور إلى مكتبة الوسائط</strong><small>الصورة البارزة وصور المقال إن أمكن.</small></span>
          </label>
        </div>

        <div className="cms-wp-import-actions">
          <button className="cms-ghost-button" type="button" disabled={busy || !file} onClick={() => void run("preview")}>
            {busy ? "جار الفحص..." : "فحص الملف ومعاينته"}
          </button>
          <button className="dashboard-primary cms-wp-import-primary" type="button" disabled={busy || !preview.length} onClick={() => void run("import")}>
            <UploadCloud size={18} />
            {busy ? "جار الاستيراد..." : "بدء الاستيراد"}
          </button>
        </div>
      </div>

      {message && <div className="cms-message">{message}</div>}

      {summary && (
        <div className="cms-import-summary cms-wp-summary">
          <span><strong>{summary.rows}</strong> إجمالي المقالات</span>
          <span><strong>{summary.new}</strong> جديدة</span>
          <span><strong>{summary.existing}</strong> موجودة</span>
          <span><strong>{summary.images ?? 0}</strong> صور مكتشفة</span>
          <span><strong>{summary.invalid}</strong> غير صالحة</span>
        </div>
      )}

      {preview.length > 0 && (
        <div className="table-wrap cms-table-wrap cms-wp-preview">
          <div className="panel-heading"><div><h3>معاينة قبل الاستيراد</h3><p>لن يتم حفظ أي مقال حتى تضغط «بدء الاستيراد».</p></div></div>
          <table>
            <thead>
              <tr><th>#</th><th>العنوان</th><th>التصنيف</th><th>الكاتب</th><th>الحالة</th><th>مكرر؟</th><th>الملاحظات</th></tr>
            </thead>
            <tbody>
              {preview.map((row) => (
                <tr key={`${row.row}-${row.slug}`}>
                  <td>{row.row}</td>
                  <td><strong>{row.title}</strong><small dir="ltr">{row.slug}</small></td>
                  <td>{row.category || "-"}</td>
                  <td>{row.author || "-"}</td>
                  <td>{row.status}</td>
                  <td>{row.duplicate ? "نعم" : "لا"}</td>
                  <td>{row.warnings.length ? row.warnings.join("، ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && (
        <div className="cms-wp-import-result">
          <div className="cms-wp-result-title">
            {(result.failed ?? 0) === 0 ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            <div><strong>نتيجة الاستيراد</strong><small>تمت معالجة ملف WordPress.</small></div>
          </div>
          <div className="cms-import-summary">
            <span><strong>{result.imported ?? 0}</strong> مقالات جديدة</span>
            <span><strong>{result.updated ?? 0}</strong> تم تحديثها</span>
            <span><strong>{result.skipped ?? 0}</strong> تم تجاوزها</span>
            <span><strong>{result.imagesImported ?? 0}</strong> صور محفوظة</span>
            <span><strong>{result.imagesFailed ?? 0}</strong> صور فشلت</span>
            <span><strong>{result.failed ?? 0}</strong> مقالات فشلت</span>
          </div>
          {!!result.errors?.length && <details><summary>أخطاء المقالات</summary><pre>{result.errors.join("\n")}</pre></details>}
          {!!result.imageErrors?.length && <details><summary>أخطاء الصور</summary><pre>{result.imageErrors.join("\n")}</pre></details>}
        </div>
      )}
    </section>
  );
}
