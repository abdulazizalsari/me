"use client";

import { useState } from "react";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({ message: "تعذر الاتصال بالخادم." }));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.message ?? "بيانات الدخول غير صحيحة.");
      return;
    }
    window.location.replace("/admin");
  }

  return (
    <main className="admin-login">
      <section className="admin-login-card">
        <p className="eyebrow">لوحة التحكم</p>
        <h1>تسجيل الدخول</h1>
        <p className="admin-muted">الدخول متاح للمدير والمحررين المصرح لهم.</p>
        <form onSubmit={submit}>
          <label>البريد الإلكتروني<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>كلمة المرور<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {message && <p className="cms-form-error">{message}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "جار التحقق..." : "دخول"}</button>
        </form>
      </section>
    </main>
  );
}
