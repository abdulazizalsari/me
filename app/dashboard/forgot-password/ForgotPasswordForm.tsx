"use client";

import Link from "next/link";
import { Mail, RotateCcwKey } from "lucide-react";
import { useState } from "react";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase-config";

const RESET_URL = "https://abdulazizalsari.net/dashboard/reset-password";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(RESET_URL)}`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email: email.trim() })
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.msg || data?.message || "تعذر إرسال رابط الاستعادة.");
        return;
      }

      setSent(true);
      setMessage("تم إرسال رابط استعادة كلمة المرور إلى بريدك. افتح أحدث رسالة فقط.");
    } catch {
      setMessage("تعذر الاتصال بخدمة الاستعادة. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="cms-login-shell" dir="rtl">
      <section className="cms-login-card">
        <div className="cms-login-mark"><RotateCcwKey size={24} /></div>
        <p className="eyebrow">لوحة إدارة المحتوى</p>
        <h1>نسيت كلمة المرور؟</h1>
        <p className="muted">أدخل بريد المدير وسنرسل رابطًا آمنًا لتعيين كلمة مرور جديدة.</p>

        <form onSubmit={submit} className="cms-login-form">
          <label>
            البريد الإلكتروني
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          {message && <p className={sent ? "cms-form-success" : "cms-form-error"}>{message}</p>}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            <Mail size={18} />
            {busy ? "جار الإرسال..." : "إرسال رابط الاستعادة"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 14 }}>
          <Link href="/dashboard/login">العودة إلى تسجيل الدخول</Link>
        </p>
      </section>
    </main>
  );
}
