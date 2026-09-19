"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function SetupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("tr@abdulazizalsari.net");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      setMessage(data.message || (response.ok ? "تم." : "حدث خطأ."));
      if (response.ok && data.confirmed) router.replace("/dashboard");
    } finally { setBusy(false); }
  }

  return <form className="admin-login-form" onSubmit={submit}>
    <label>البريد الإلكتروني<input dir="ltr" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required /></label>
    <label>كلمة المرور<input dir="ltr" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} minLength={12} required /></label>
    <button type="submit" disabled={busy}>{busy ? "جارٍ الإنشاء..." : "إنشاء المدير"}</button>
    {message && <p className="muted" role="status">{message}</p>}
  </form>;
}
