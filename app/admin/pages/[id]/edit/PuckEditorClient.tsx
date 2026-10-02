"use client";

import { Puck, type Data } from "@puckeditor/core";
import { useState } from "react";
import { puckConfig } from "@/lib/puck/config";

const arabicDictionary = {
  "header-publish": "حفظ ونشر",
  "header-publish-loading": "جار الحفظ...",
  "components": "المكونات",
  "fields": "الحقول",
  "outline": "الهيكل",
  "add-component": "إضافة مكوّن"
};

export function PuckEditorClient({ pageId, initialData }: { pageId: string; initialData: Data }) {
  const [message, setMessage] = useState("");

  async function save(data: Data) {
    setMessage("جار الحفظ...");
    const response = await fetch(`/api/admin/pages/${encodeURIComponent(pageId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data })
    });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? "تم حفظ الصفحة" : (payload.message || "تعذر الحفظ"));
    window.setTimeout(() => setMessage(""), 2200);
  }

  return (
    <div className="puck-admin-editor" dir="rtl">
      <Puck
        config={puckConfig}
        data={initialData}
        onPublish={save}
        dnd={{ behavior: "static" }}
        dictionary={arabicDictionary}
        headerTitle="محرر الصفحات"
      />
      {message && <div className="puck-save-message">{message}</div>}
    </div>
  );
}
