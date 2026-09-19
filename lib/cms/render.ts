import { BarChart3, Code2, GraduationCap, Handshake, Megaphone, Palette, ReceiptText, Search, Share2, Tag } from "lucide-react";
import type { CmsContentItem } from "./types";

const iconMap = { BarChart3, Code2, GraduationCap, Handshake, Megaphone, Palette, ReceiptText, Search, Share2, Tag };

export function iconForItem(item: CmsContentItem) {
  const key = typeof item.meta?.icon === "string" ? item.meta.icon : "BriefcaseBusiness";
  return iconMap[key as keyof typeof iconMap] ?? Handshake;
}

export function localizedItem(item: CmsContentItem, locale: "ar" | "en") {
  return {
    title: locale === "ar" ? item.titleAr : item.titleEn,
    summary: locale === "ar" ? item.summaryAr : item.summaryEn,
    body: locale === "ar" ? item.bodyAr : item.bodyEn
  };
}
