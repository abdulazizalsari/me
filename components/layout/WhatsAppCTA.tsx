"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { siteUrl } from "@/data/site";
import type { Locale } from "@/lib/i18n";
import type { WhatsAppSettings } from "@/lib/cms/whatsapp";

function localeForPath(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ar";
}

function pageContext(pathname: string, locale: Locale) {
  const cleanPath = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  const ar = locale === "ar";
  if (cleanPath === "/") return ar ? "الصفحة الرئيسية" : "Home page";
  if (cleanPath === "/about") return ar ? "من أنا" : "About page";
  if (cleanPath === "/services") return ar ? "الخدمات" : "Services";
  if (cleanPath.startsWith("/services/")) return ar ? "تفاصيل خدمة" : "Service details";
  if (cleanPath === "/training") return ar ? "التدريب" : "Training";
  if (cleanPath.startsWith("/training/")) return ar ? "تفاصيل دورة" : "Course details";
  if (cleanPath === "/ruaa") return ar ? "الرؤى" : "Insights";
  if (cleanPath.startsWith("/ruaa/")) return ar ? "مقال من رؤى" : "Insights article";
  if (cleanPath === "/contact") return ar ? "التواصل" : "Contact";
  if (cleanPath === "/consultation") return ar ? "طلب استشارة" : "Consultation";
  if (cleanPath === "/cv") return ar ? "السيرة الذاتية" : "CV";
  if (cleanPath === "/privacy-policy") return ar ? "سياسة الخصوصية" : "Privacy policy";
  return ar ? "صفحة داخلية" : "Website page";
}

function routeIsHidden(pathname: string, routes: string[]) {
  return routes.some((raw) => {
    const route = raw.trim();
    if (!route) return false;
    if (route === "*") return true;
    if (route.endsWith("*")) return pathname.startsWith(route.slice(0, -1));
    return pathname === route || pathname.startsWith(route.endsWith("/") ? route : `${route}/`);
  });
}

export function WhatsAppCTA({ settings }: { settings: WhatsAppSettings }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const locale = localeForPath(pathname);
  const ar = locale === "ar";
  const context = useMemo(() => pageContext(pathname, locale), [locale, pathname]);
  const sourceUrl = `${siteUrl}${pathname || "/"}`;
  const hidden = routeIsHidden(pathname, settings.hiddenRoutes);
  const phone = settings.phone.replace(/\D+/g, "");
  const shouldRender = settings.enabled && Boolean(phone) && !hidden;

  const message = useMemo(() => {
    const parts: string[] = [];
    parts.push(ar ? settings.greetingAr : settings.greetingEn);
    parts.push(draft.trim() || (ar ? settings.defaultMessageAr : settings.defaultMessageEn));
    if (settings.includePageContext) {
      parts.push(ar ? `مصدر الاستفسار: ${context}` : `Inquiry source: ${context}`);
    }
    if (settings.includePageTitle && pageTitle) {
      parts.push(ar ? `عنوان الصفحة: ${pageTitle}` : `Page title: ${pageTitle}`);
    }
    if (settings.includePageUrl) {
      parts.push(ar ? `رابط الصفحة: ${sourceUrl}` : `Page URL: ${sourceUrl}`);
    }
    return parts.filter(Boolean).join("\n\n");
  }, [ar, context, draft, pageTitle, settings, sourceUrl]);

  useEffect(() => {
    setPageTitle(document.title.replace(/ \| AbdulAziz Al-Sari$/, ""));
  }, [pathname]);

  useEffect(() => {
    if (!shouldRender) return;
    const openDialog = () => setOpen(true);
    window.addEventListener("open-whatsapp-dialog", openDialog);
    return () => window.removeEventListener("open-whatsapp-dialog", openDialog);
  }, [shouldRender]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (!settings.closeOnOutside) return;
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, settings.closeOnOutside]);

  useEffect(() => {
    if (!shouldRender || !settings.autoOpen) return;
    try {
      if (settings.autoOpenOncePerSession && sessionStorage.getItem("wa-auto-opened") === "1") return;
    } catch {
      // Session storage can be unavailable in strict privacy modes.
    }
    const timer = window.setTimeout(() => {
      setOpen(true);
      if (settings.autoOpenOncePerSession) {
        try { sessionStorage.setItem("wa-auto-opened", "1"); } catch { /* ignore */ }
      }
    }, settings.autoOpenDelaySeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [pathname, settings.autoOpen, settings.autoOpenDelaySeconds, settings.autoOpenOncePerSession, shouldRender]);

  if (!shouldRender) return null;

  function openWhatsApp() {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  const widgetStyle = {
    "--wa-right": `${settings.rightOffset}px`,
    "--wa-bottom": `${settings.bottomOffset}px`,
    "--wa-button-size": `${settings.buttonSize}px`,
    "--wa-panel-width": `${settings.panelWidth}px`,
    "--wa-gap": `${settings.panelGap}px`,
    "--wa-primary": settings.primaryColor,
    "--wa-accent": settings.accentColor,
    "--wa-button": settings.buttonColor,
    "--wa-button-icon": settings.buttonIconColor,
    "--wa-panel": settings.panelBackground,
    "--wa-text": settings.textColor,
    "--wa-muted": settings.mutedColor
  } as CSSProperties;

  return (
    <div
      ref={widgetRef}
      className={`whatsapp-widget${settings.enablePulse ? " has-pulse" : ""}`}
      style={widgetStyle}
      data-show-desktop={String(settings.showDesktop)}
      data-show-mobile={String(settings.showMobile)}
    >
      {open && (
        <section className="whatsapp-popover" id="whatsapp-popover" role="dialog" aria-labelledby="whatsapp-popover-title">
          <div className="whatsapp-popover-head">
            <span className="whatsapp-agent-avatar" aria-hidden="true">
              <svg viewBox="0 0 32 32"><path fill="currentColor" d="M16 3.2a12.7 12.7 0 0 0-10.9 19l-1.5 5.5 5.7-1.5A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.4l-.4-.2-3.4.9.9-3.3-.2-.4A10.4 10.4 0 1 1 16 26.4Z" /></svg>
            </span>
            <div>
              <strong>{ar ? settings.agentNameAr : settings.agentNameEn}</strong>
              <span><i aria-hidden="true" />{ar ? settings.statusAr : settings.statusEn}</span>
            </div>
            <button className="whatsapp-close" type="button" aria-label={ar ? "إغلاق" : "Close"} onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="whatsapp-popover-body">
            <h2 className="h3" id="whatsapp-popover-title">{ar ? settings.titleAr : settings.titleEn}</h2>
            <p className="whatsapp-subtitle">{ar ? settings.subtitleAr : settings.subtitleEn}</p>
            {settings.showMessageField && (
              <label className="whatsapp-field">
                {ar ? "رسالتك" : "Your message"}
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={ar ? settings.placeholderAr : settings.placeholderEn}
                  rows={4}
                />
              </label>
            )}
            <button className="whatsapp-send" type="button" onClick={openWhatsApp}>
              <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3.2a12.7 12.7 0 0 0-10.9 19l-1.5 5.5 5.7-1.5A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.4l-.4-.2-3.4.9.9-3.3-.2-.4A10.4 10.4 0 1 1 16 26.4Z" /></svg>
              {ar ? settings.sendLabelAr : settings.sendLabelEn}
            </button>
          </div>
          <span className="whatsapp-popover-arrow" aria-hidden="true" />
        </section>
      )}

      <button
        className="whatsapp"
        type="button"
        aria-label={ar ? "تواصل عبر واتساب" : "Contact via WhatsApp"}
        aria-expanded={open}
        aria-controls="whatsapp-popover"
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3.2a12.7 12.7 0 0 0-10.9 19l-1.5 5.5 5.7-1.5A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.4l-.4-.2-3.4.9.9-3.3-.2-.4A10.4 10.4 0 1 1 16 26.4Zm5.7-7.7c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2l-.8 1c-.2.2-.3.2-.6.1a8.4 8.4 0 0 1-2.5-1.5 9.3 9.3 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.7l.5-.6c.1-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.1 1.3 3.3c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.3.3-.6.3-1.2.2-1.3-.1-.2-.3-.2-.7-.4Z" /></svg>
      </button>
    </div>
  );
}
