"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export function ContactForm({ locale, consultation = false }: { locale: Locale; consultation?: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const t = locale === "ar" ? {
    name: "الاسم الكامل", email: "البريد الإلكتروني", phone: "واتساب / الهاتف", company: "الشركة",
    service: "الخدمة", budget: "الميزانية", country: "الدولة", type: "نوع الاستشارة", stage: "مرحلة المشروع",
    challenge: "التحدي الرئيسي", message: "رسالتك", send: "إرسال الرسالة", loading: "جار الإرسال...",
    sent: "تم استلام رسالتك بنجاح. سنتواصل معك في أقرب وقت ممكن.",
    error: "تعذر إرسال الرسالة الآن. تحقق من البيانات وحاول مرة أخرى.",
    services: ["التسويق الرقمي", "تطوير الأعمال", "تطوير المواقع", "التجارة الدولية"], budgetDiscuss: "تحدد لاحقاً"
  } : {
    name: "Full name", email: "Email", phone: "Phone / WhatsApp", company: "Company",
    service: "Service", budget: "Budget range", country: "Country", type: "Consultation type", stage: "Business stage",
    challenge: "Main challenge", message: "Your message", send: "Send Message", loading: "Sending...",
    sent: "Your message was received successfully. I’ll get back to you as soon as possible.",
    error: "We could not send your message. Please check the details and try again.",
    services: ["Digital Marketing", "Business Development", "Website Development", "International Trade"], budgetDiscuss: "To be discussed"
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("loading");
    setErrorMessage("");
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, source: consultation ? "consultation" : "contact" })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(typeof data.message === "string" ? data.message : t.error);
        setStatus("error");
        return;
      }
      form.reset();
      setStatus("success");
    } catch {
      setErrorMessage(t.error);
      setStatus("error");
    }
  }

  return (
    <form className="grid form-grid card form-card contact-form" onSubmit={submit} noValidate>
      <div className="field"><label htmlFor="name">{t.name}</label><input id="name" name="name" required minLength={2} autoComplete="name" /></div>
      <div className="field"><label htmlFor="email">{t.email}</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
      <div className="field"><label htmlFor="phone">{t.phone}</label><input id="phone" name="phone" required minLength={5} autoComplete="tel" inputMode="tel" /></div>
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
          <div className="field"><label htmlFor="service">{t.service}</label><select id="service" name="service" defaultValue={t.services[0]}>{t.services.map((service) => <option key={service}>{service}</option>)}</select></div>
          <div className="field"><label htmlFor="budget">{t.budget}</label><select id="budget" name="budget" defaultValue={t.budgetDiscuss}><option>{t.budgetDiscuss}</option><option>$1k-$3k</option><option>$3k-$8k</option><option>$8k+</option></select></div>
        </>
      )}
      <div className="field full"><label htmlFor="message">{t.message}</label><textarea id="message" name="message" required minLength={10} rows={6} /></div>
      <div className="full form-actions contact-form-actions">
        <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
          <Send size={18} aria-hidden /> <span>{status === "loading" ? t.loading : t.send}</span>
        </button>
        {status === "success" ? <span className="contact-form-status success" role="status"><CheckCircle2 size={18} aria-hidden />{t.sent}</span> : null}
        {status === "error" ? <span className="contact-form-status error" role="alert">{errorMessage || t.error}</span> : null}
      </div>
    </form>
  );
}