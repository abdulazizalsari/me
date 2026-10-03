"use client";

import { useEffect, useRef, useState } from "react";

type RichTextEditorProps = {
  label: string;
  value: string;
  dir: "rtl" | "ltr";
  onChange: (value: string) => void;
  allowSource?: boolean;
};

function embedUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
    if (url.hostname === "open.spotify.com") {
      return `https://open.spotify.com/embed${url.pathname}`;
    }
  } catch { /* invalid url */ }
  return "";
}

export function RichTextEditor({ label, value, dir, onChange, allowSource = false }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [sourceMode, setSourceMode] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || sourceMode) return;
    if (editor.innerHTML !== value) editor.innerHTML = value;
  }, [value, sourceMode]);

  function sync() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function run(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    sync();
  }

  function insertHtml(html: string) {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    sync();
  }

  function promptText(ar: string, en: string, fallback = "") {
    return window.prompt(dir === "rtl" ? ar : en, fallback)?.trim() ?? "";
  }

  function addLink() {
    const url = promptText("أدخل رابط الصفحة", "Enter link URL", "https://");
    if (!url) return;
    run("createLink", url);
  }

  function addImage() {
    const url = promptText("أدخل رابط الصورة من مكتبة الوسائط أو رابط HTTPS", "Enter image URL", "https://");
    if (!url) return;
    const alt = promptText("النص البديل للصورة", "Image alt text");
    insertHtml(`<figure class="article-inline-image"><img src="${url.replace(/"/g, "&quot;")}" alt="${alt.replace(/"/g, "&quot;")}" loading="lazy"></figure><p><br></p>`);
  }

  function addTable() {
    insertHtml('<div class="article-table-wrap"><table><thead><tr><th>عنوان 1</th><th>عنوان 2</th></tr></thead><tbody><tr><td>بيان</td><td>بيان</td></tr><tr><td>بيان</td><td>بيان</td></tr></tbody></table></div><p><br></p>');
  }

  function addCallout() {
    const title = promptText("عنوان الملاحظة", "Callout title", dir === "rtl" ? "ملاحظة" : "Note");
    const body = promptText("نص الملاحظة", "Callout text");
    insertHtml(`<aside class="article-callout"><strong>${title}</strong><p>${body}</p></aside><p><br></p>`);
  }

  function addButton() {
    const labelText = promptText("نص الزر", "Button label", dir === "rtl" ? "اعرف المزيد" : "Learn more");
    const url = promptText("رابط الزر", "Button URL", "/");
    if (!labelText || !url) return;
    insertHtml(`<p><a class="article-content-button" href="${url.replace(/"/g, "&quot;")}">${labelText}</a></p>`);
  }

  function addVideo() {
    const raw = promptText("رابط YouTube أو Vimeo أو Spotify", "YouTube, Vimeo or Spotify URL", "https://");
    const src = embedUrl(raw);
    if (!src) {
      window.alert(dir === "rtl" ? "الرابط غير مدعوم. استخدم YouTube أو Vimeo أو Spotify." : "Unsupported URL. Use YouTube, Vimeo, or Spotify.");
      return;
    }
    insertHtml(`<div class="article-embed"><iframe src="${src}" title="Embedded media" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br></p>`);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    if (html) document.execCommand("insertHTML", false, html);
    else document.execCommand("insertText", false, text);
    sync();
  }

  return (
    <div className="cms-visual-editor" dir={dir}>
      <div className="cms-visual-editor-label">{label}</div>
      <div className="cms-visual-toolbar" role="toolbar" aria-label={dir === "rtl" ? "أدوات تنسيق المحتوى" : "Content formatting tools"}>
        <button type="button" onClick={() => run("formatBlock", "p")}>{dir === "rtl" ? "نص" : "Text"}</button>
        <button type="button" onClick={() => run("formatBlock", "h2")}>H2</button>
        <button type="button" onClick={() => run("formatBlock", "h3")}>H3</button>
        <button type="button" onClick={() => run("bold")}><strong>B</strong></button>
        <button type="button" onClick={() => run("italic")}><em>I</em></button>
        <button type="button" onClick={() => run("insertUnorderedList")}>{dir === "rtl" ? "قائمة" : "List"}</button>
        <button type="button" onClick={() => run("insertOrderedList")}>1.</button>
        <button type="button" onClick={() => run("formatBlock", "blockquote")}>{dir === "rtl" ? "اقتباس" : "Quote"}</button>
        <button type="button" onClick={addLink}>{dir === "rtl" ? "رابط" : "Link"}</button>
        <button type="button" onClick={addImage}>{dir === "rtl" ? "صورة" : "Image"}</button>
        <button type="button" onClick={addVideo}>{dir === "rtl" ? "فيديو" : "Video"}</button>
        <button type="button" onClick={() => insertHtml("<hr>")}>{dir === "rtl" ? "فاصل" : "Divider"}</button>
        <button type="button" onClick={addTable}>{dir === "rtl" ? "جدول" : "Table"}</button>
        <button type="button" onClick={addCallout}>Callout</button>
        <button type="button" onClick={addButton}>{dir === "rtl" ? "زر" : "Button"}</button>
        <button type="button" onClick={() => run(dir === "rtl" ? "justifyRight" : "justifyLeft")}>{dir === "rtl" ? "يمين" : "Left"}</button>
        <button type="button" onClick={() => run("justifyCenter")}>{dir === "rtl" ? "وسط" : "Center"}</button>
        <button type="button" onClick={() => run("removeFormat")}>{dir === "rtl" ? "مسح التنسيق" : "Clear"}</button>
        <button type="button" onClick={() => run("undo")}>{dir === "rtl" ? "تراجع" : "Undo"}</button>
        <button type="button" onClick={() => run("redo")}>{dir === "rtl" ? "إعادة" : "Redo"}</button>
        {allowSource && <button type="button" className={sourceMode ? "active" : ""} onClick={() => setSourceMode((current) => !current)}>HTML</button>}
      </div>

      {sourceMode ? (
        <textarea
          className="cms-source-editor"
          dir="ltr"
          rows={18}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={dir === "rtl" ? "محرر مصدر HTML" : "HTML source editor"}
        />
      ) : (
        <div
          ref={editorRef}
          className="cms-visual-editor-canvas"
          contentEditable
          suppressContentEditableWarning
          dir={dir}
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
          onPaste={handlePaste}
        />
      )}
      <p className="cms-editor-help">
        {dir === "rtl" ? "محرر بصري متكامل. وضع HTML يظهر للمدير فقط، ويتم تنظيف الأكواد الخطرة قبل الحفظ." : "Full visual editor. HTML mode is admin-only and dangerous markup is sanitized before saving."}
      </p>
    </div>
  );
}
