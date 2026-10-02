"use client";

import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase-config";

export function ResetPasswordForm() {
  const [accessToken, setAccessToken] = useState("");
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("access_token") || "";
    const type = params.get("type") || "";

    if (token && type === "recovery") {
      setAccessToken(token);
      setReady(true);
      return;
    }

    setMessage("رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.");
    setReady(false);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 10) {
      setMessage("استخدم كلمة مرور لا تقل عن 10 أحرف.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("كلمتا المرور غير متطابقتين.");
      return;
    }
    if (!accessToken) {
      setMessage("جلسة الاستعادة غير موجودة. اطلب رابطًا جديدًا.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.msg || data?.message || "تعذر تغيير كلمة المرور. اطلب رابط استعادة جديدًا.");
        return;
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      setDone(true);
      setMessage("تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setMessage("تعذر الاتصال بخدمة تغيير كلمة المرور.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="cms-login-shell" dir="rtl">
      <section className="cms-login-card">
        <div className="cms-login-mark">{done ? <ShieldCheck size={24} /> : <KeyRound size={24} />}</div>
        <p className="eyebrow">لوحة إدارة المحتوى</p>
        <h1>تعيين كلمة مرور جديدة</h1>
        <p className="muted">اختر كلمة مرور قوية خاصة بلوحة إدارة الموقع.</p>

        {!done && ready && (
          <form onSubmit={submit} className="cms-login-form">
            <label>
              كلمة المرور الجديدة
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={10}
                required
              />
            </label>

            <label>
              تأكيد كلمة المرور
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={10}
                required
              />
            </label>

            <button className="btn btn-primary" type="submit" disabled={busy}>
              <KeyRound size={18} />
              {busy ? "جار الحفظ..." : "حفظ كلمة المرور الجديدة"}
            </button>
          </form>
        )}

        {message && <p className={done ? "cms-form-success" : "cms-form-error"}>{message}</p>}

        <p style={{ textAlign: "center", marginTop: 14 }}>
          <Link href={done ? "/dashboard/login" : "/dashboard/forgot-password"}>
            {done ? "الانتقال إلى تسجيل الدخول" : "طلب رابط استعادة جديد"}
          </Link>
        </p>
      </section>
    </main>
  );
}
