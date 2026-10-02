"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { IntegrationConfig } from "@/lib/integrations";
import { trackingIsConfigured } from "@/lib/integrations";

type ConsentState = "unknown" | "accepted" | "rejected";
const consentKey = "aas_tracking_consent_v1";

function appendScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function loadGoogleAnalytics(id: string) {
  appendScript("aas-ga4-lib", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
  const w = window as typeof window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function (...args: unknown[]) { w.dataLayer?.push(args); };
  w.gtag("js", new Date());
  w.gtag("config", id, { anonymize_ip: true });
}

function loadGoogleTagManager(id: string) {
  if (document.getElementById("aas-gtm")) return;
  const w = window as typeof window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  appendScript("aas-gtm", `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`);
}

function loadMetaPixel(id: string) {
  const w = window as typeof window & { fbq?: any; _fbq?: any };
  if (!w.fbq) {
    const fbq: any = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    w.fbq = fbq;
    w._fbq = fbq;
    appendScript("aas-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
  }
  w.fbq?.("init", id);
  w.fbq?.("track", "PageView");
}

function loadTikTokPixel(id: string) {
  const w = window as typeof window & { TiktokAnalyticsObject?: string; ttq?: any };
  if (w.ttq?.page) {
    w.ttq.page();
    return;
  }
  const ttq: any = w.ttq || [];
  w.TiktokAnalyticsObject = "ttq";
  w.ttq = ttq;
  ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
  ttq.setAndDefer = (target: any, method: string) => {
    target[method] = (...args: unknown[]) => target.push([method, ...args]);
  };
  ttq.methods.forEach((method: string) => ttq.setAndDefer(ttq, method));
  ttq.load = (pixelId: string) => appendScript("aas-tiktok-pixel", `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(pixelId)}&lib=ttq`);
  ttq.load(id);
  ttq.page();
}

function loadAdSense(clientId: string) {
  appendScript("aas-adsense", `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`);
}

export default function TrackingManager({ config }: { config: IntegrationConfig }) {
  const [consent, setConsent] = useState<ConsentState>("unknown");
  const [panelOpen, setPanelOpen] = useState(false);
  const trackingConfigured = useMemo(() => trackingIsConfigured(config), [config]);

  useEffect(() => {
    if (!config.trackingConsentRequired) {
      setConsent("accepted");
      return;
    }
    const stored = window.localStorage.getItem(consentKey);
    setConsent(stored === "accepted" || stored === "rejected" ? stored : "unknown");
  }, [config.trackingConsentRequired]);

  const canTrack = trackingConfigured && (!config.trackingConsentRequired || consent === "accepted");

  useEffect(() => {
    if (!canTrack) return;
    if (config.gtmEnabled && /^GTM-[A-Z0-9]+$/.test(config.gtmContainerId)) loadGoogleTagManager(config.gtmContainerId);
    if (config.ga4Enabled && /^G-[A-Z0-9]+$/.test(config.ga4MeasurementId)) loadGoogleAnalytics(config.ga4MeasurementId);
    if (config.metaPixelEnabled && /^\d{5,30}$/.test(config.metaPixelId)) loadMetaPixel(config.metaPixelId);
    if (config.tiktokPixelEnabled && /^[A-Z0-9]{8,40}$/.test(config.tiktokPixelId)) loadTikTokPixel(config.tiktokPixelId);
    if (config.adsenseEnabled && /^ca-pub-\d{10,30}$/.test(config.adsenseClientId)) loadAdSense(config.adsenseClientId);
    window.dispatchEvent(new CustomEvent("aas:tracking-consent", { detail: { accepted: true } }));
  }, [canTrack, config]);

  if (!trackingConfigured || !config.trackingConsentRequired || !config.consentBannerEnabled) return null;

  const ar = typeof document === "undefined" ? true : document.documentElement.lang !== "en";
  const showBanner = consent === "unknown" || panelOpen;

  function accept() {
    window.localStorage.setItem(consentKey, "accepted");
    setConsent("accepted");
    setPanelOpen(false);
    window.dispatchEvent(new CustomEvent("aas:tracking-consent", { detail: { accepted: true } }));
  }

  function reject() {
    window.localStorage.setItem(consentKey, "rejected");
    window.dispatchEvent(new CustomEvent("aas:tracking-consent", { detail: { accepted: false } }));
    window.location.reload();
  }

  return (
    <>
      {showBanner && (
        <section className="tracking-consent" role="dialog" aria-live="polite" aria-label={ar ? "إعدادات الخصوصية والتتبع" : "Privacy and tracking settings"}>
          <div>
            <strong>{ar ? "الخصوصية والتتبع" : "Privacy & tracking"}</strong>
            <p>{ar ? config.consentTextAr : config.consentTextEn}</p>
            <Link href={ar ? "/privacy-policy" : "/en/privacy-policy"}>{ar ? "سياسة الخصوصية" : "Privacy policy"}</Link>
          </div>
          <div className="tracking-consent-actions">
            <button type="button" className="btn btn-primary" onClick={accept}>{ar ? "قبول التتبع" : "Accept tracking"}</button>
            <button type="button" className="btn btn-secondary" onClick={reject}>{ar ? "رفض" : "Reject"}</button>
          </div>
        </section>
      )}
      {consent !== "unknown" && !showBanner && (
        <button className="tracking-privacy-button" type="button" onClick={() => setPanelOpen(true)}>
          {ar ? "الخصوصية والتتبع" : "Privacy & tracking"}
        </button>
      )}
    </>
  );
}
