import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { getContentBySlug, saveContentItem } from "@/lib/cms/database";

type Section = "search-console" | "bing" | "ga4" | "gtm" | "meta" | "tiktok" | "adsense" | "privacy";

const allowedKeys: Record<Section, string[]> = {
  "search-console": ["googleSearchConsoleEnabled", "googleSiteVerification"],
  bing: ["bingEnabled", "bingVerification"],
  ga4: ["ga4Enabled", "ga4MeasurementId"],
  gtm: ["gtmEnabled", "gtmContainerId"],
  meta: ["metaPixelEnabled", "metaPixelId"],
  tiktok: ["tiktokPixelEnabled", "tiktokPixelId"],
  adsense: ["adsenseEnabled","adsenseClientId","adInsightsTopEnabled","adInsightsTopSlotId","adArticleTopEnabled","adArticleTopSlotId","adArticleInlineEnabled","adArticleInlineSlotId","adArticleBottomEnabled","adArticleBottomSlotId"],
  privacy: ["trackingConsentRequired","consentBannerEnabled","consentTextAr","consentTextEn"]
};

function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().replace(/[<>]/g, "").slice(0, max) : "";
}
function cleanValue(key: string, value: unknown) {
  if (key.endsWith("Enabled") || key === "trackingConsentRequired" || key === "consentBannerEnabled") return value === true;
  if (key === "ga4MeasurementId") {
    const result = cleanText(value, 32).toUpperCase();
    if (result && !/^G-[A-Z0-9]+$/.test(result)) throw new Error("معرّف GA4 غير صالح. يجب أن يبدأ بـ G-.");
    return result;
  }
  if (key === "gtmContainerId") {
    const result = cleanText(value, 32).toUpperCase();
    if (result && !/^GTM-[A-Z0-9]+$/.test(result)) throw new Error("معرّف GTM غير صالح. يجب أن يبدأ بـ GTM-.");
    return result;
  }
  if (key === "metaPixelId") {
    const result = cleanText(value, 40);
    if (result && !/^\d{5,30}$/.test(result)) throw new Error("Meta Pixel ID يجب أن يكون أرقامًا فقط.");
    return result;
  }
  if (key === "tiktokPixelId") {
    const result = cleanText(value, 48).toUpperCase();
    if (result && !/^[A-Z0-9]{8,40}$/.test(result)) throw new Error("TikTok Pixel ID غير صالح.");
    return result;
  }
  if (key === "adsenseClientId") {
    const result = cleanText(value, 48);
    if (result && !/^ca-pub-\d{10,30}$/.test(result)) throw new Error("AdSense Client ID غير صالح.");
    return result;
  }
  if (key.endsWith("SlotId")) {
    const result = cleanText(value, 40);
    if (result && !/^\d{5,30}$/.test(result)) throw new Error("Ad slot ID يجب أن يكون أرقامًا فقط.");
    return result;
  }
  if (key === "consentTextAr" || key === "consentTextEn") return cleanText(value, 700);
  return cleanText(value, 300);
}

function requireConfigured(meta: Record<string, unknown>) {
  if (meta.googleSearchConsoleEnabled === true && !String(meta.googleSiteVerification || "")) throw new Error("أدخل رمز Google Search Console قبل التفعيل.");
  if (meta.bingEnabled === true && !String(meta.bingVerification || "")) throw new Error("أدخل رمز Bing قبل التفعيل.");
  if (meta.ga4Enabled === true && !/^G-[A-Z0-9]+$/.test(String(meta.ga4MeasurementId || ""))) throw new Error("أدخل Measurement ID صالحًا قبل تفعيل GA4.");
  if (meta.gtmEnabled === true && !/^GTM-[A-Z0-9]+$/.test(String(meta.gtmContainerId || ""))) throw new Error("أدخل Container ID صالحًا قبل تفعيل GTM.");
  if (meta.metaPixelEnabled === true && !/^\d{5,30}$/.test(String(meta.metaPixelId || ""))) throw new Error("أدخل Meta Pixel ID صالحًا قبل التفعيل.");
  if (meta.tiktokPixelEnabled === true && !/^[A-Z0-9]{8,40}$/.test(String(meta.tiktokPixelId || ""))) throw new Error("أدخل TikTok Pixel ID صالحًا قبل التفعيل.");
  if (meta.adsenseEnabled === true && !/^ca-pub-\d{10,30}$/.test(String(meta.adsenseClientId || ""))) throw new Error("أدخل AdSense Client ID صالحًا قبل التفعيل.");
  for (const [enabledKey, slotKey] of [["adInsightsTopEnabled","adInsightsTopSlotId"],["adArticleTopEnabled","adArticleTopSlotId"],["adArticleInlineEnabled","adArticleInlineSlotId"],["adArticleBottomEnabled","adArticleBottomSlotId"]]) {
    if (meta[enabledKey] === true && !/^\d{5,30}$/.test(String(meta[slotKey] || ""))) throw new Error("كل موضع إعلان مفعّل يحتاج Ad slot ID صالحًا.");
  }
}

export async function POST(request: Request) {
  const user = await getCurrentAdmin();
  if (!user || user.role !== "admin") return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const body = await request.json().catch(() => null) as { section?: Section; values?: Record<string, unknown> } | null;
  if (!body?.section || !allowedKeys[body.section] || !body.values || typeof body.values !== "object") {
    return NextResponse.json({ ok: false, message: "إعدادات التكامل غير صالحة." }, { status: 400 });
  }
  try {
    for (const key of Object.keys(body.values)) {
      if (/secret|private[_-]?key|access[_-]?token|refresh[_-]?token|api[_-]?key/i.test(key)) {
        return NextResponse.json({ ok: false, message: "لا تُدخل الأسرار أو مفاتيح API الخاصة في هذا القسم." }, { status: 400 });
      }
    }
    const current = await getContentBySlug("integration", "site-integrations");
    const nextMeta: Record<string, unknown> = { ...(current?.meta ?? {}) };
    for (const key of allowedKeys[body.section]) {
      if (Object.prototype.hasOwnProperty.call(body.values, key)) nextMeta[key] = cleanValue(key, body.values[key]);
    }
    requireConfigured(nextMeta);
    const item = await saveContentItem({
      id: current?.id,
      type: "integration",
      slug: "site-integrations",
      titleAr: "التكاملات والتتبع",
      titleEn: "Integrations & Tracking",
      summaryAr: "إعدادات خدمات التحقق والتحليلات والإعلانات وموافقة التتبع.",
      summaryEn: "Verification, analytics, advertising and tracking consent settings.",
      bodyAr: "",
      bodyEn: "",
      category: "system",
      status: "published",
      sortOrder: 900,
      meta: nextMeta
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "تعذر حفظ إعدادات التكامل." }, { status: 400 });
  }
}
