"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";

export function ArticleShare({ title, locale }: { title: string; locale: "ar" | "en" }) {
  const [copied, setCopied] = useState(false);
  const ar = locale === "ar";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(ar ? "انسخ الرابط" : "Copy link", window.location.href);
    }
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title, url: window.location.href }).catch(() => undefined);
      return;
    }
    await copyLink();
  }

  return (
    <div className="article-share">
      <strong>{ar ? "مشاركة" : "Share"}</strong>
      <button type="button" onClick={() => void share()}><Share2 size={15} aria-hidden />{ar ? "مشاركة" : "Share"}</button>
      <a href={`https://wa.me/?text=${encodeURIComponent(title)}`} target="_blank" rel="noreferrer">WhatsApp</a>
      <button type="button" onClick={() => void copyLink()}>{copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}{copied ? (ar ? "تم النسخ" : "Copied") : (ar ? "نسخ الرابط" : "Copy link")}</button>
    </div>
  );
}
