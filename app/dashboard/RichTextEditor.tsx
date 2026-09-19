"use client";

import { useEffect, useRef } from "react";

type RichTextEditorProps = {
  label: string;
  value: string;
  dir: "rtl" | "ltr";
  onChange: (value: string) => void;
};

export function RichTextEditor({ label, value, dir, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) editor.innerHTML = value;
  }, [value]);

  function run(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function addLink() {
    const url = window.prompt(dir === "rtl" ? "أدخل رابط الصفحة" : "Enter link URL");
    if (!url) return;
    run("createLink", url);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  return (
    <div className="cms-visual-editor" dir={dir}>
      <div className="cms-visual-editor-label">{label}</div>
      <div className="cms-visual-toolbar" role="toolbar" aria-label={dir === "rtl" ? "أدوات تنسيق المحتوى" : "Content formatting tools"}>
        <button type="button" onClick={() => run("formatBlock", "p")}>{dir === "rtl" ? "نص" : "Text"}</button>
        <button type="button" onClick={() => run("formatBlock", "h2")}>H2</button>
        <button type="button" onClick={() => run("bold")}><strong>B</strong></button>
        <button type="button" onClick={() => run("italic")}><em>I</em></button>
        <button type="button" onClick={() => run("insertUnorderedList")}>{dir === "rtl" ? "قائمة" : "List"}</button>
        <button type="button" onClick={() => run("insertOrderedList")}>1.</button>
        <button type="button" onClick={() => run("formatBlock", "blockquote")}>{dir === "rtl" ? "اقتباس" : "Quote"}</button>
        <button type="button" onClick={addLink}>{dir === "rtl" ? "رابط" : "Link"}</button>
        <button type="button" onClick={() => run(dir === "rtl" ? "justifyRight" : "justifyLeft")}>{dir === "rtl" ? "يمين" : "Left"}</button>
        <button type="button" onClick={() => run("justifyCenter")}>{dir === "rtl" ? "وسط" : "Center"}</button>
        <button type="button" onClick={() => run("removeFormat")}>{dir === "rtl" ? "مسح التنسيق" : "Clear"}</button>
        <button type="button" onClick={() => run("undo")}>{dir === "rtl" ? "تراجع" : "Undo"}</button>
        <button type="button" onClick={() => run("redo")}>{dir === "rtl" ? "إعادة" : "Redo"}</button>
      </div>
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
      <p className="cms-editor-help">
        {dir === "rtl" ? "اكتب ونسّق المحتوى كما سيظهر للزائر. لا تحتاج إلى كتابة HTML." : "Write and format content visually. No HTML editing is required."}
      </p>
    </div>
  );
}
