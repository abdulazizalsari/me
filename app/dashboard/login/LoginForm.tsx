"use client";

import { LockKeyhole, LogIn } from "lucide-react";
import { useState } from "react";

export function LoginForm() {
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

    window.location.replace("/dashboard");
  }

  return (
    <main className="cms-login-shell" dir="rtl">
      <section className="cms-login-card">
        <div className="cms-login-mark"><LockKeyhole size={24} /></div>
        <p className="eyebrow">لوحة إدارة المحتوى</p>
        <h1>تسجيل الدخول</h1>
        <p className="muted">أدخل بيانات المدير للوصول إلى إدارة المحتوى والوسائط.</p>
        <form action="/api/admin/login-page" method="post" onSubmit={submit} className="cms-login-form">
          <label>
            البريد الإلكتروني
            <input name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            كلمة المرور
            <input name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {message && <p className="cms-form-error">{message}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            <LogIn size={18} />
            {busy ? "جار التحقق..." : "دخول اللوحة"}
          </button>
        </form>
      </section>
    </main>
  );
}
