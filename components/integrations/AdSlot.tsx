"use client";

import { useEffect, useState } from "react";
import type { AdPlacement, IntegrationConfig } from "@/lib/integrations";
import { adPlacement } from "@/lib/integrations";

const consentKey = "aas_tracking_consent_v1";

export function AdSlot({ config, placement, locale }: { config: IntegrationConfig; placement: AdPlacement; locale: "ar" | "en" }) {
  const slot = adPlacement(config, placement);
  const [allowed, setAllowed] = useState(!config.trackingConsentRequired);

  useEffect(() => {
    const refresh = () => setAllowed(!config.trackingConsentRequired || window.localStorage.getItem(consentKey) === "accepted");
    refresh();
    window.addEventListener("aas:tracking-consent", refresh);
    return () => window.removeEventListener("aas:tracking-consent", refresh);
  }, [config.trackingConsentRequired]);

  useEffect(() => {
    if (!allowed || !config.adsenseEnabled || !slot.enabled || !/^\d{5,30}$/.test(slot.slotId)) return;
    const w = window as typeof window & { adsbygoogle?: unknown[] };
    w.adsbygoogle = w.adsbygoogle || [];
    try { w.adsbygoogle.push({}); } catch { }
  }, [allowed, config.adsenseEnabled, slot.enabled, slot.slotId]);

  if (!allowed || !config.adsenseEnabled || !/^ca-pub-\d{10,30}$/.test(config.adsenseClientId) || !slot.enabled || !/^\d{5,30}$/.test(slot.slotId)) return null;

  return (
    <aside className={`site-ad-slot site-ad-${placement}`} aria-label={locale === "ar" ? "إعلان" : "Advertisement"}>
      <span>{locale === "ar" ? "إعلان" : "Advertisement"}</span>
      <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client={config.adsenseClientId} data-ad-slot={slot.slotId} data-ad-format="auto" data-full-width-responsive="true" />
    </aside>
  );
}
