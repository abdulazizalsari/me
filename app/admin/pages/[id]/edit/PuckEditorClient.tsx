"use client";
import { Puck, type Data } from "@puckeditor/core";
import { useState } from "react";
import { puckConfig } from "@/lib/puck/config";
import type { CmsLanguage } from "@/lib/cms/types";

const arabicDictionary={
  "header-publish":"حفظ",
  "header-publish-loading":"جار الحفظ...",
  "components":"المكونات",
  "fields":"الحقول",
  "outline":"الهيكل",
  "add-component":"إضافة مكوّن",
  "viewport-switch":"تبديل العرض إلى {label}"
};

export function PuckEditorClient({pageId,initialData,currentLocale,languages,pageTitle}:{pageId:string;initialData:Data;currentLocale:string;languages:CmsLanguage[];pageTitle:string}) {
  const [message,setMessage]=useState("");
  async function save(data:Data) {
    setMessage("جار الحفظ...");
    const response=await fetch(`/api/admin/pages/${encodeURIComponent(pageId)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({data,locale:currentLocale})});
    const payload=await response.json().catch(()=>({}));
    setMessage(response.ok?"تم حفظ الصفحة":(payload.message||"تعذر الحفظ"));
    window.setTimeout(()=>setMessage(""),2200);
  }
  return <div className="puck-admin-editor" dir="rtl">
    <div className="puck-locale-bar"><strong>{pageTitle}</strong><div>{languages.filter(l=>l.enabled).map(l=><a key={l.code} className={l.code===currentLocale?"active":""} href={`?locale=${l.code}`}>{l.nameAr}</a>)}</div></div>
    <Puck config={puckConfig} data={initialData} onPublish={save} dnd={{behavior:"static"}} dictionary={arabicDictionary} headerTitle="محرر الصفحات" />
    {message&&<div className="puck-save-message">{message}</div>}
  </div>;
}
