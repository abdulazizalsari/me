import type { CmsContentItem } from "./types";

function translatedWhenSourceExists(source: string, translated: string) {
  return !source.trim() || Boolean(translated.trim());
}

export function hasContentTranslation(
  item: CmsContentItem,
  language: string,
  map: Record<string, string> = {}
) {
  if (language === "ar") return true;

  const base = `content.${item.type}.${item.id}`;
  if (language === "en") {
    return (
      translatedWhenSourceExists(item.titleAr, item.titleEn) &&
      translatedWhenSourceExists(item.summaryAr, item.summaryEn) &&
      translatedWhenSourceExists(item.bodyAr ?? "", item.bodyEn ?? "")
    );
  }

  return (
    translatedWhenSourceExists(item.titleAr, map[`${base}.title`] ?? "") &&
    translatedWhenSourceExists(item.summaryAr, map[`${base}.summary`] ?? "") &&
    translatedWhenSourceExists(item.bodyAr ?? "", map[`${base}.body`] ?? "")
  );
}

export function localizedContent(
  item: CmsContentItem,
  language: string,
  map: Record<string, string>
) {
  const base = `content.${item.type}.${item.id}`;

  if (language === "ar") {
    return {
      title: item.titleAr,
      summary: item.summaryAr,
      body: item.bodyAr || item.summaryAr
    };
  }

  if (language === "en") {
    return {
      title: item.titleEn.trim(),
      summary: item.summaryEn.trim(),
      body: (item.bodyEn || item.summaryEn).trim()
    };
  }

  return {
    title: (map[`${base}.title`] ?? "").trim(),
    summary: (map[`${base}.summary`] ?? "").trim(),
    body: (map[`${base}.body`] || map[`${base}.summary`] || "").trim()
  };
}
