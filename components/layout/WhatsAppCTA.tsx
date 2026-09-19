"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { person, siteUrl } from "@/data/site";
import type { Locale } from "@/lib/i18n";

function localeForPath(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ar";
}

function pageContext(pathname: string, locale: Locale) {
  if (pathname.includes("/services")) return locale === "ar" ? "الخدمات" : "Services";
  if (pathname.includes("/training")) return locale === "ar" ? "التدريب أو الدورة" : "Training or course";
  if (pathname.includes("/ruaa")) return locale === "ar" ? "الرؤى" : "Insights";
  if (pathname.includes("/contact")) return locale === "ar" ? "التواصل" : "Contact";
  return locale === "ar" ? "الصفحة الرئيسية" : "Home page";
}

export function WhatsAppCTA() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const pathname = usePathname();
  const locale = localeForPath(pathname);
  const context = useMemo(() => pageContext(pathname, locale), [locale, pathname]);
  const sourceUrl = `${siteUrl}${pathname || "/"}`;
  const title = typeof document !== "undefined" ? document.title.replace(/ \| AbdulAziz Al-Sari$/, "") : context;
  const message = locale === "ar"
    ? `مرحباً عبدالعزيز الصاري،\n\n${draft || "أرغب في معرفة المزيد."}\n\nمصدر الاستفسار:\n${title}\n\nرابط الصفحة:\n${sourceUrl}`
    : `Hello AbdulAziz Al-Sari,\n\n${draft || "I would like to learn more."}\n\nInquiry source:\n${title}\n\nPage URL:\n${sourceUrl}`;

  useEffect(() => {
    const openDialog = () => setOpen(true);
    window.addEventListener("open-whatsapp-dialog", openDialog);
    if (!open) return () => window.removeEventListener("open-whatsapp-dialog", openDialog);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("open-whatsapp-dialog", openDialog);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openWhatsApp() {
    window.open(`${person.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <>
      <button className="whatsapp" type="button" aria-label={locale === "ar" ? "تواصل عبر واتساب" : "Contact via WhatsApp"} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3.2a12.7 12.7 0 0 0-10.9 19l-1.5 5.5 5.7-1.5A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.4l-.4-.2-3.4.9.9-3.3-.2-.4A10.4 10.4 0 1 1 16 26.4Zm5.7-7.7c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2l-.8 1c-.2.2-.3.2-.6.1a8.4 8.4 0 0 1-2.5-1.5 9.3 9.3 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.7l.5-.6c.1-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.1 1.3 3.3c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.3.3-.6.3-1.2.2-1.3-.1-.2-.3-.2-.7-.4Z" /></svg>
      </button>
      {open ? (
        <div className="whatsapp-dialog" role="dialog" aria-modal="true" aria-label={locale === "ar" ? "رسالة واتساب" : "WhatsApp message"} onClick={() => setOpen(false)}>
          <div className="whatsapp-card" onClick={(event) => event.stopPropagation()}>
            <button className="whatsapp-close" type="button" aria-label={locale === "ar" ? "إغلاق" : "Close"} onClick={() => setOpen(false)}>
              <span aria-hidden="true">×</span>
            </button>
            <div className="icon-box"><span className="whatsapp-mini-icon">◔</span></div>
            <h2 className="h3">{locale === "ar" ? "تواصل عبر واتساب" : "Contact via WhatsApp"}</h2>
            <p className="muted">{locale === "ar" ? `مصدر الاستفسار: ${context}` : `Inquiry source: ${context}`}</p>
            <label className="whatsapp-field">{locale === "ar" ? "رسالتك" : "Your message"}<textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={locale === "ar" ? "اكتب رسالتك هنا..." : "Write your message here..."} rows={4} /></label>
            <button className="btn btn-primary" type="button" onClick={openWhatsApp}>{locale === "ar" ? "إرسال عبر واتساب" : "Send via WhatsApp"}</button>
          </div>
        </div>
      ) : null}
    </>
  );
}

