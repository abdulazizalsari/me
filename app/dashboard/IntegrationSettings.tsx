"use client";

import { useMemo, useState } from "react";
import { BarChart3, BadgeCheck, CircleAlert, Cookie, ExternalLink, Megaphone, MousePointerClick, Save, Search, Tag, Waypoints } from "lucide-react";
import { integrationConfigFromMeta } from "@/lib/integrations";

type Meta = Record<string, unknown>;
type Section = "search-console" | "bing" | "ga4" | "gtm" | "meta" | "tiktok" | "adsense" | "privacy";

function Status({ enabled, configured }: { enabled: boolean; configured: boolean }) {
  const className = enabled && configured ? "ready" : configured ? "paused" : "needs";
  const Icon = enabled && configured ? BadgeCheck : CircleAlert;
  const label = enabled && configured ? "مضبوط ونشط" : configured ? "مضبوط ومتوقف" : "يحتاج إلى إعداد";
  return <span className={`integration-badge ${className}`}><Icon size={15} />{label}</span>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="integration-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span aria-hidden="true" /><strong>{label}</strong></label>;
}

export function IntegrationSettings({ initialMeta }: { initialMeta: Meta }) {
  const [meta, setMeta] = useState<Meta>(initialMeta);
  const [saving, setSaving] = useState<Section | null>(null);
  const [message, setMessage] = useState("");
  const config = useMemo(() => integrationConfigFromMeta(meta), [meta]);

  function set(key: string, value: unknown) {
    setMeta((current) => ({ ...current, [key]: value }));
  }

  async function save(section: Section, keys: string[]) {
    setSaving(section);
    setMessage("");
    const values = Object.fromEntries(keys.map((key) => [key, meta[key]]));
    const response = await fetch("/api/admin/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, values })
    });
    const data = await response.json().catch(() => ({}));
    setSaving(null);
    if (!response.ok || !data.item) {
      setMessage(data.message || "تعذر حفظ إعدادات التكامل.");
      return;
    }
    setMeta(data.item.meta || {});
    setMessage("تم حفظ إعدادات هذا التكامل بنجاح.");
  }

  const cards = [
    {
      section: "search-console" as Section, icon: Search, title: "Google Search Console",
      description: "التحقق من ملكية الموقع وربط خريطة الموقع بمحرك Google.",
      enabled: config.googleSearchConsoleEnabled, configured: Boolean(config.googleSiteVerification),
      keys: ["googleSearchConsoleEnabled", "googleSiteVerification"],
      body: <>
        <Toggle checked={config.googleSearchConsoleEnabled} onChange={(value) => set("googleSearchConsoleEnabled", value)} label="تفعيل التحقق" />
        <label>رمز التحقق<input dir="ltr" value={config.googleSiteVerification} onChange={(e) => set("googleSiteVerification", e.target.value)} placeholder="xxxxxxxxxxxxxxxx" /></label>
        <p className="integration-help">Search Console ← Settings ← Ownership verification ← HTML tag. انسخ قيمة <b>content</b> فقط. بعد التحقق أرسل <code>https://abdulazizalsari.net/sitemap.xml</code>.</p>
        <a className="integration-external" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">فتح Search Console <ExternalLink size={14} /></a>
      </>
    },
    {
      section: "bing" as Section, icon: Search, title: "Bing Webmaster Tools",
      description: "إثبات ملكية الموقع لدى Bing بواسطة Meta Tag.",
      enabled: config.bingEnabled, configured: Boolean(config.bingVerification),
      keys: ["bingEnabled", "bingVerification"],
      body: <>
        <Toggle checked={config.bingEnabled} onChange={(value) => set("bingEnabled", value)} label="تفعيل التحقق" />
        <label>رمز Bing<input dir="ltr" value={config.bingVerification} onChange={(e) => set("bingVerification", e.target.value)} placeholder="xxxxxxxxxxxxxxxx" /></label>
        <p className="integration-help">Bing Webmaster Tools ← Verify ownership ← HTML Meta Tag، ثم انسخ قيمة content.</p>
      </>
    },
    {
      section: "ga4" as Section, icon: BarChart3, title: "Google Analytics 4",
      description: "قياس الزيارات والأحداث بعد موافقة الزائر عند تفعيل الموافقة.",
      enabled: config.ga4Enabled, configured: /^G-[A-Z0-9]+$/.test(config.ga4MeasurementId),
      keys: ["ga4Enabled", "ga4MeasurementId"],
      body: <>
        <Toggle checked={config.ga4Enabled} onChange={(value) => set("ga4Enabled", value)} label="تفعيل GA4" />
        <label>Measurement ID<input dir="ltr" value={config.ga4MeasurementId} onChange={(e) => set("ga4MeasurementId", e.target.value.toUpperCase())} placeholder="G-XXXXXXXXXX" /></label>
        <p className="integration-help">Google Analytics ← Admin ← Data streams ← Web ← Measurement ID.</p>
      </>
    },
    {
      section: "gtm" as Section, icon: Waypoints, title: "Google Tag Manager",
      description: "إدارة وسوم التسويق من حاوية GTM واحدة.",
      enabled: config.gtmEnabled, configured: /^GTM-[A-Z0-9]+$/.test(config.gtmContainerId),
      keys: ["gtmEnabled", "gtmContainerId"],
      body: <>
        <Toggle checked={config.gtmEnabled} onChange={(value) => set("gtmEnabled", value)} label="تفعيل GTM" />
        <label>Container ID<input dir="ltr" value={config.gtmContainerId} onChange={(e) => set("gtmContainerId", e.target.value.toUpperCase())} placeholder="GTM-XXXXXXX" /></label>
        <p className="integration-help">ستجد Container ID أعلى مساحة العمل في Tag Manager ويبدأ بـ GTM-.</p>
      </>
    },
    {
      section: "meta" as Section, icon: MousePointerClick, title: "Meta Pixel",
      description: "تتبع الزيارات والتحويلات لحملات Meta بشكل اختياري.",
      enabled: config.metaPixelEnabled, configured: /^\d{5,30}$/.test(config.metaPixelId),
      keys: ["metaPixelEnabled", "metaPixelId"],
      body: <>
        <Toggle checked={config.metaPixelEnabled} onChange={(value) => set("metaPixelEnabled", value)} label="تفعيل Meta Pixel" />
        <label>Pixel ID<input dir="ltr" value={config.metaPixelId} onChange={(e) => set("metaPixelId", e.target.value.replace(/\D/g, ""))} placeholder="123456789012345" /></label>
        <p className="integration-help">Meta Events Manager ← Data Sources ← اختر Pixel ← Settings، ثم انسخ Pixel ID.</p>
      </>
    },
    {
      section: "tiktok" as Section, icon: Tag, title: "TikTok Pixel",
      description: "قياس نتائج حملات TikTok عند الحاجة.",
      enabled: config.tiktokPixelEnabled, configured: /^[A-Z0-9]{8,40}$/.test(config.tiktokPixelId),
      keys: ["tiktokPixelEnabled", "tiktokPixelId"],
      body: <>
        <Toggle checked={config.tiktokPixelEnabled} onChange={(value) => set("tiktokPixelEnabled", value)} label="تفعيل TikTok Pixel" />
        <label>Pixel ID<input dir="ltr" value={config.tiktokPixelId} onChange={(e) => set("tiktokPixelId", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="CXXXXXXXXXXXXXXXXXXX" /></label>
        <p className="integration-help">TikTok Ads Manager ← Events Manager ← Web Events ← اختر Pixel ثم انسخ Pixel ID.</p>
      </>
    },
    {
      section: "adsense" as Section, icon: Megaphone, title: "Google AdSense والإعلانات",
      description: "تحميل AdSense والتحكم المستقل بمواضع الإعلانات داخل قسم رؤى.",
      enabled: config.adsenseEnabled, configured: /^ca-pub-\d{10,30}$/.test(config.adsenseClientId),
      keys: ["adsenseEnabled","adsenseClientId","adInsightsTopEnabled","adInsightsTopSlotId","adArticleTopEnabled","adArticleTopSlotId","adArticleInlineEnabled","adArticleInlineSlotId","adArticleBottomEnabled","adArticleBottomSlotId"],
      body: <>
        <Toggle checked={config.adsenseEnabled} onChange={(value) => set("adsenseEnabled", value)} label="تفعيل AdSense" />
        <label>Publisher / Client ID<input dir="ltr" value={config.adsenseClientId} onChange={(e) => set("adsenseClientId", e.target.value.trim())} placeholder="ca-pub-XXXXXXXXXXXXXXXX" /></label>
        <div className="integration-ad-placements">
          {[
            ["adInsightsTopEnabled","adInsightsTopSlotId","أعلى صفحة رؤى",config.adInsightsTopEnabled,config.adInsightsTopSlotId],
            ["adArticleTopEnabled","adArticleTopSlotId","أعلى المقال",config.adArticleTopEnabled,config.adArticleTopSlotId],
            ["adArticleInlineEnabled","adArticleInlineSlotId","داخل المقال",config.adArticleInlineEnabled,config.adArticleInlineSlotId],
            ["adArticleBottomEnabled","adArticleBottomSlotId","أسفل المقال",config.adArticleBottomEnabled,config.adArticleBottomSlotId]
          ].map(([enabledKey,slotKey,label,enabled,slotId]) => (
            <div className="integration-ad-row" key={String(slotKey)}>
              <Toggle checked={Boolean(enabled)} onChange={(value) => set(String(enabledKey), value)} label={String(label)} />
              <input dir="ltr" inputMode="numeric" value={String(slotId)} onChange={(e) => set(String(slotKey), e.target.value.replace(/\D/g, ""))} placeholder="Ad slot ID" />
            </div>
          ))}
        </div>
        <p className="integration-help">Publisher ID من AdSense ← Account information. لكل موضع أنشئ Ad unit ثم انسخ رقم Ad slot الخاص به.</p>
      </>
    },
    {
      section: "privacy" as Section, icon: Cookie, title: "الموافقة والخصوصية",
      description: "منع أدوات التتبع من العمل قبل الموافقة وإتاحة سحب الموافقة لاحقًا.",
      enabled: config.consentBannerEnabled, configured: true,
      keys: ["trackingConsentRequired","consentBannerEnabled","consentTextAr","consentTextEn"],
      body: <>
        <Toggle checked={config.trackingConsentRequired} onChange={(value) => set("trackingConsentRequired", value)} label="اشتراط موافقة الزائر قبل التتبع" />
        <Toggle checked={config.consentBannerEnabled} onChange={(value) => set("consentBannerEnabled", value)} label="إظهار لوحة الموافقة" />
        <label>النص العربي<textarea rows={3} value={config.consentTextAr} onChange={(e) => set("consentTextAr", e.target.value)} /></label>
        <label>English text<textarea dir="ltr" rows={3} value={config.consentTextEn} onChange={(e) => set("consentTextEn", e.target.value)} /></label>
        <p className="integration-help">بعد الاختيار يظهر للزائر زر «الخصوصية والتتبع» لإعادة فتح اللوحة وسحب الموافقة. عند الرفض يعاد تحميل الصفحة بدون أدوات التتبع.</p>
      </>
    }
  ];

  return (
    <section className="dashboard-panel cms-panel integration-manager">
      <div className="panel-heading integration-manager-heading">
        <div><p className="eyebrow">إعدادات متقدمة</p><h2>التكاملات والتتبع</h2><p>كل خدمة مستقلة بإعداداتها وحفظها، وأدوات القياس الإعلانية لا تعمل قبل الموافقة عندما يكون ذلك مفعّلًا.</p></div>
      </div>
      {message && <p className="cms-message">{message}</p>}
      <div className="integration-grid">
        {cards.map(({ section, icon: Icon, title, description, enabled, configured, keys, body }) => (
          <article className="integration-card" key={section}>
            <header><span className="integration-icon"><Icon size={20} /></span><div><h3>{title}</h3><p>{description}</p></div><Status enabled={enabled} configured={configured} /></header>
            <div className="integration-card-body">{body}</div>
            <footer><button className="btn btn-primary" type="button" disabled={saving === section} onClick={() => save(section, keys)}><Save size={16} />{saving === section ? "جار الحفظ..." : "حفظ هذا التكامل"}</button></footer>
          </article>
        ))}
      </div>
      <aside className="integration-security-note"><strong>إضافة خدمات جديدة مستقبلًا</strong><p>النظام مبني على أقسام ومفاتيح مستقلة. لا يوجد حقل JavaScript عام، ولا تُخزَّن أسرار API في الواجهة. أي خدمة جديدة تضاف كمجموعة مفاتيح مع تحقق مستقل ونطاقات CSP محددة.</p></aside>
    </section>
  );
}
