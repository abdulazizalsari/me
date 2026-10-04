import type { CmsContentItem } from "./types";

export type WhatsAppSettings = {
  enabled: boolean;
  phone: string;
  showDesktop: boolean;
  showMobile: boolean;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  agentNameAr: string;
  agentNameEn: string;
  statusAr: string;
  statusEn: string;
  greetingAr: string;
  greetingEn: string;
  placeholderAr: string;
  placeholderEn: string;
  sendLabelAr: string;
  sendLabelEn: string;
  defaultMessageAr: string;
  defaultMessageEn: string;
  includePageContext: boolean;
  includePageTitle: boolean;
  includePageUrl: boolean;
  showMessageField: boolean;
  autoOpen: boolean;
  autoOpenDelaySeconds: number;
  autoOpenOncePerSession: boolean;
  closeOnOutside: boolean;
  enablePulse: boolean;
  hiddenRoutes: string[];
  rightOffset: number;
  bottomOffset: number;
  buttonSize: number;
  panelWidth: number;
  panelGap: number;
  primaryColor: string;
  accentColor: string;
  buttonColor: string;
  buttonIconColor: string;
  panelBackground: string;
  textColor: string;
  mutedColor: string;
};

export const defaultWhatsAppSettings: WhatsAppSettings = {
  enabled: true,
  phone: "905413929436",
  showDesktop: true,
  showMobile: true,
  titleAr: "تواصل عبر واتساب",
  titleEn: "Contact via WhatsApp",
  subtitleAr: "اكتب رسالتك وسأرد عليك في أقرب وقت.",
  subtitleEn: "Write your message and I will get back to you as soon as possible.",
  agentNameAr: "عبدالعزيز الصاري",
  agentNameEn: "AbdulAziz Al-Sari",
  statusAr: "متاح للرد",
  statusEn: "Available",
  greetingAr: "مرحباً عبدالعزيز الصاري،",
  greetingEn: "Hello AbdulAziz Al-Sari,",
  placeholderAr: "اكتب رسالتك هنا...",
  placeholderEn: "Write your message here...",
  sendLabelAr: "إرسال عبر واتساب",
  sendLabelEn: "Send via WhatsApp",
  defaultMessageAr: "أرغب في معرفة المزيد.",
  defaultMessageEn: "I would like to learn more.",
  includePageContext: true,
  includePageTitle: true,
  includePageUrl: true,
  showMessageField: true,
  autoOpen: false,
  autoOpenDelaySeconds: 8,
  autoOpenOncePerSession: true,
  closeOnOutside: true,
  enablePulse: true,
  hiddenRoutes: [],
  rightOffset: 26,
  bottomOffset: 26,
  buttonSize: 58,
  panelWidth: 360,
  panelGap: 14,
  primaryColor: "#003E46",
  accentColor: "#FF5A19",
  buttonColor: "#003E46",
  buttonIconColor: "#FFFFFF",
  panelBackground: "#FFFFFF",
  textColor: "#173532",
  mutedColor: "#66736F"
};

function bool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function str(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function color(value: unknown, fallback: string) {
  const next = typeof value === "string" ? value.trim() : "";
  return /^#[0-9a-f]{6}$/i.test(next) ? next : fallback;
}

function routes(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
  return [];
}

export function whatsappSettingsFromItem(item?: CmsContentItem | null): WhatsAppSettings {
  const meta = item?.meta ?? {};
  return {
    enabled: bool(meta.enabled, defaultWhatsAppSettings.enabled),
    phone: str(meta.phone, defaultWhatsAppSettings.phone).replace(/\D+/g, ""),
    showDesktop: bool(meta.showDesktop, true),
    showMobile: bool(meta.showMobile, true),
    titleAr: str(meta.titleAr, item?.titleAr || defaultWhatsAppSettings.titleAr),
    titleEn: str(meta.titleEn, item?.titleEn || defaultWhatsAppSettings.titleEn),
    subtitleAr: str(meta.subtitleAr, item?.summaryAr || defaultWhatsAppSettings.subtitleAr),
    subtitleEn: str(meta.subtitleEn, item?.summaryEn || defaultWhatsAppSettings.subtitleEn),
    agentNameAr: str(meta.agentNameAr, defaultWhatsAppSettings.agentNameAr),
    agentNameEn: str(meta.agentNameEn, defaultWhatsAppSettings.agentNameEn),
    statusAr: str(meta.statusAr, defaultWhatsAppSettings.statusAr),
    statusEn: str(meta.statusEn, defaultWhatsAppSettings.statusEn),
    greetingAr: str(meta.greetingAr, defaultWhatsAppSettings.greetingAr),
    greetingEn: str(meta.greetingEn, defaultWhatsAppSettings.greetingEn),
    placeholderAr: str(meta.placeholderAr, defaultWhatsAppSettings.placeholderAr),
    placeholderEn: str(meta.placeholderEn, defaultWhatsAppSettings.placeholderEn),
    sendLabelAr: str(meta.sendLabelAr, defaultWhatsAppSettings.sendLabelAr),
    sendLabelEn: str(meta.sendLabelEn, defaultWhatsAppSettings.sendLabelEn),
    defaultMessageAr: str(meta.defaultMessageAr, defaultWhatsAppSettings.defaultMessageAr),
    defaultMessageEn: str(meta.defaultMessageEn, defaultWhatsAppSettings.defaultMessageEn),
    includePageContext: bool(meta.includePageContext, true),
    includePageTitle: bool(meta.includePageTitle, true),
    includePageUrl: bool(meta.includePageUrl, true),
    showMessageField: bool(meta.showMessageField, true),
    autoOpen: bool(meta.autoOpen, false),
    autoOpenDelaySeconds: num(meta.autoOpenDelaySeconds, 8, 0, 120),
    autoOpenOncePerSession: bool(meta.autoOpenOncePerSession, true),
    closeOnOutside: bool(meta.closeOnOutside, true),
    enablePulse: bool(meta.enablePulse, true),
    hiddenRoutes: routes(meta.hiddenRoutes),
    rightOffset: num(meta.rightOffset, 26, 8, 120),
    bottomOffset: num(meta.bottomOffset, 26, 8, 180),
    buttonSize: num(meta.buttonSize, 58, 44, 82),
    panelWidth: num(meta.panelWidth, 360, 280, 460),
    panelGap: num(meta.panelGap, 14, 8, 36),
    primaryColor: color(meta.primaryColor, defaultWhatsAppSettings.primaryColor),
    accentColor: color(meta.accentColor, defaultWhatsAppSettings.accentColor),
    buttonColor: color(meta.buttonColor, defaultWhatsAppSettings.buttonColor),
    buttonIconColor: color(meta.buttonIconColor, defaultWhatsAppSettings.buttonIconColor),
    panelBackground: color(meta.panelBackground, defaultWhatsAppSettings.panelBackground),
    textColor: color(meta.textColor, defaultWhatsAppSettings.textColor),
    mutedColor: color(meta.mutedColor, defaultWhatsAppSettings.mutedColor)
  };
}
