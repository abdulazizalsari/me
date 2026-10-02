export type AdPlacement = "insightsTop" | "articleTop" | "articleInline" | "articleBottom";

export type IntegrationConfig = {
  googleSearchConsoleEnabled: boolean;
  googleSiteVerification: string;
  bingEnabled: boolean;
  bingVerification: string;
  ga4Enabled: boolean;
  ga4MeasurementId: string;
  gtmEnabled: boolean;
  gtmContainerId: string;
  metaPixelEnabled: boolean;
  metaPixelId: string;
  tiktokPixelEnabled: boolean;
  tiktokPixelId: string;
  adsenseEnabled: boolean;
  adsenseClientId: string;
  adInsightsTopEnabled: boolean;
  adInsightsTopSlotId: string;
  adArticleTopEnabled: boolean;
  adArticleTopSlotId: string;
  adArticleInlineEnabled: boolean;
  adArticleInlineSlotId: string;
  adArticleBottomEnabled: boolean;
  adArticleBottomSlotId: string;
  trackingConsentRequired: boolean;
  consentBannerEnabled: boolean;
  consentTextAr: string;
  consentTextEn: string;
};

const defaults: IntegrationConfig = {
  googleSearchConsoleEnabled: false,
  googleSiteVerification: "",
  bingEnabled: false,
  bingVerification: "",
  ga4Enabled: false,
  ga4MeasurementId: "",
  gtmEnabled: false,
  gtmContainerId: "",
  metaPixelEnabled: false,
  metaPixelId: "",
  tiktokPixelEnabled: false,
  tiktokPixelId: "",
  adsenseEnabled: false,
  adsenseClientId: "",
  adInsightsTopEnabled: false,
  adInsightsTopSlotId: "",
  adArticleTopEnabled: false,
  adArticleTopSlotId: "",
  adArticleInlineEnabled: false,
  adArticleInlineSlotId: "",
  adArticleBottomEnabled: false,
  adArticleBottomSlotId: "",
  trackingConsentRequired: true,
  consentBannerEnabled: true,
  consentTextAr: "نستخدم أدوات قياس اختيارية لفهم استخدام الموقع وتحسين التجربة. لن يتم تشغيل أدوات التتبع قبل موافقتك.",
  consentTextEn: "We use optional analytics tools to understand site usage and improve the experience. Tracking will not load before your consent."
};

function text(meta: Record<string, unknown> | undefined, key: string) {
  return typeof meta?.[key] === "string" ? String(meta[key]).trim() : "";
}
function bool(meta: Record<string, unknown> | undefined, key: string, fallback = false) {
  return typeof meta?.[key] === "boolean" ? Boolean(meta[key]) : fallback;
}

export function integrationConfigFromMeta(meta?: Record<string, unknown>): IntegrationConfig {
  return {
    googleSearchConsoleEnabled: bool(meta, "googleSearchConsoleEnabled"),
    googleSiteVerification: text(meta, "googleSiteVerification").replace(/^google-site-verification=/i, ""),
    bingEnabled: bool(meta, "bingEnabled"),
    bingVerification: text(meta, "bingVerification"),
    ga4Enabled: bool(meta, "ga4Enabled"),
    ga4MeasurementId: text(meta, "ga4MeasurementId").toUpperCase(),
    gtmEnabled: bool(meta, "gtmEnabled"),
    gtmContainerId: text(meta, "gtmContainerId").toUpperCase(),
    metaPixelEnabled: bool(meta, "metaPixelEnabled"),
    metaPixelId: text(meta, "metaPixelId"),
    tiktokPixelEnabled: bool(meta, "tiktokPixelEnabled"),
    tiktokPixelId: text(meta, "tiktokPixelId").toUpperCase(),
    adsenseEnabled: bool(meta, "adsenseEnabled"),
    adsenseClientId: text(meta, "adsenseClientId"),
    adInsightsTopEnabled: bool(meta, "adInsightsTopEnabled"),
    adInsightsTopSlotId: text(meta, "adInsightsTopSlotId"),
    adArticleTopEnabled: bool(meta, "adArticleTopEnabled"),
    adArticleTopSlotId: text(meta, "adArticleTopSlotId"),
    adArticleInlineEnabled: bool(meta, "adArticleInlineEnabled"),
    adArticleInlineSlotId: text(meta, "adArticleInlineSlotId"),
    adArticleBottomEnabled: bool(meta, "adArticleBottomEnabled"),
    adArticleBottomSlotId: text(meta, "adArticleBottomSlotId"),
    trackingConsentRequired: bool(meta, "trackingConsentRequired", defaults.trackingConsentRequired),
    consentBannerEnabled: bool(meta, "consentBannerEnabled", defaults.consentBannerEnabled),
    consentTextAr: text(meta, "consentTextAr") || defaults.consentTextAr,
    consentTextEn: text(meta, "consentTextEn") || defaults.consentTextEn
  };
}

export function trackingIsConfigured(config: IntegrationConfig) {
  return (
    (config.ga4Enabled && /^G-[A-Z0-9]+$/.test(config.ga4MeasurementId)) ||
    (config.gtmEnabled && /^GTM-[A-Z0-9]+$/.test(config.gtmContainerId)) ||
    (config.metaPixelEnabled && /^\d{5,30}$/.test(config.metaPixelId)) ||
    (config.tiktokPixelEnabled && /^[A-Z0-9]{8,40}$/.test(config.tiktokPixelId)) ||
    (config.adsenseEnabled && /^ca-pub-\d{10,30}$/.test(config.adsenseClientId))
  );
}

export function adPlacement(config: IntegrationConfig, placement: AdPlacement) {
  const map = {
    insightsTop: { enabled: config.adInsightsTopEnabled, slotId: config.adInsightsTopSlotId },
    articleTop: { enabled: config.adArticleTopEnabled, slotId: config.adArticleTopSlotId },
    articleInline: { enabled: config.adArticleInlineEnabled, slotId: config.adArticleInlineSlotId },
    articleBottom: { enabled: config.adArticleBottomEnabled, slotId: config.adArticleBottomSlotId }
  } as const;
  return map[placement];
}
