"use client";

import { useState } from "react";

export function PuckContactForm({ buttonLabel = "إرسال الطلب" }: { buttonLabel?: string }) {
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("loading");
    const values = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, source: "puck-page" }) });
    setStatus(response.ok ? "success" : "error");
    if (response.ok) form.reset();
  }
  return <form className="puck-contact-form" onSubmit={submit}>
    <label>الاسم<input name="name" required minLength={2} /></label>
    <label>البريد الإلكتروني<input name="email" type="email" required /></label>
    <label>الهاتف<input name="phone" required /></label>
    <label className="full">الرسالة<textarea name="message" required minLength={10} rows={5} /></label>
    <div className="full puck-form-action"><button className="btn btn-primary" type="submit" disabled={status==="loading"}>{status==="loading"?"جار الإرسال...":buttonLabel}</button>{status==="success"&&<span>تم إرسال الطلب بنجاح.</span>}{status==="error"&&<span>تعذر الإرسال، حاول مرة أخرى.</span>}</div>
  </form>;
}
