"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export function ContactForm({ locale, consultation = false }: { locale: Locale; consultation?: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const t = locale === "ar" ? {
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "واتساب / الهاتف",
    company: "الشركة",
    service: "الخدمة",
    budget: "الميزانية",
    country: "الدولة",
    type: "نوع الاستشارة",
    stage: "مرحلة المشروع",
    challenge: "التحدي الرئيسي",
    message: "رسالتك",
    send: "إرسال الآن",
    loading: "جار الإرسال...",
    sent: "تم حفظ الطلب محلياً للمعاينة فقط. يلزم ربط خدمة بريد قبل التشغيل الإنتاجي.",
    services: ["التسويق الرقمي", "تطوير الأعمال", "تطوير المواقع", "التجارة الدولية"],
    budgetDiscuss: "تحدد لاحقاً"
  } : {
    name: "Full name",
    email: "Email",
    phone: "Phone / WhatsApp",
    company: "Company",
    service: "Service",
    budget: "Budget range",
    country: "Country",
    type: "Consultation type",
    stage: "Business stage",
    challenge: "Main challenge",
    message: "Your message",
    send: "Send Now",
    loading: "Sending...",
    sent: "Saved locally for preview only. Connect an email service before production launch.",
    services: ["Digital Marketing", "Business Development", "Website Development", "International Trade"],
    budgetDiscuss: "To be discussed"
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("loading");
    const values = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, source: consultation ? "consultation" : "contact" })
    });
    setStatus(response.ok ? "success" : "error");
    if (response.ok) form.reset();
  }

  return (
    <form className="grid form-grid card form-card" onSubmit={submit}>
      <div className="field"><label htmlFor="name">{t.name}</label><input id="name" name="name" required minLength={2} autoComplete="name" /></div>
      <div className="field"><label htmlFor="email">{t.email}</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
      <div className="field"><label htmlFor="phone">{t.phone}</label><input id="phone" name="phone" required autoComplete="tel" inputMode="tel" /></div>
      <div className="field"><label htmlFor="company">{t.company}</label><input id="company" name="company" autoComplete="organization" /></div>
      {consultation ? (
        <>
          <div className="field"><label htmlFor="country">{t.country}</label><input id="country" name="country" autoComplete="country-name" /></div>
          <div className="field"><label htmlFor="type">{t.type}</label><input id="type" name="type" /></div>
          <div className="field"><label htmlFor="stage">{t.stage}</label><input id="stage" name="stage" /></div>
          <div className="field"><label htmlFor="challenge">{t.challenge}</label><input id="challenge" name="challenge" /></div>
        </>
      ) : (
        <>
          <div className="field">
            <label htmlFor="service">{t.service}</label>
            <select id="service" name="service">{t.services.map((service) => <option key={service}>{service}</option>)}</select>
          </div>
          <div className="field">
            <label htmlFor="budget">{t.budget}</label>
            <select id="budget" name="budget"><option>{t.budgetDiscuss}</option><option>$1k-$3k</option><option>$3k-$8k</option><option>$8k+</option></select>
          </div>
        </>
      )}
      <div className="field full"><label htmlFor="message">{t.message}</label><textarea id="message" name="message" required minLength={10} /></div>
      <div className="full form-actions">
        <button className="btn btn-primary" type="submit" disabled={status === "loading"}><Send size={18} aria-hidden />{status === "loading" ? t.loading : t.send}</button>
        {status === "success" ? <span className="muted" role="status">{t.sent}</span> : null}
        {status === "error" ? <span className="muted" role="status">{locale === "ar" ? "تعذر حفظ الطلب. حاول مرة أخرى." : "Could not save the request. Please try again."}</span> : null}
      </div>
    </form>
  );
}
