"use client";

import { Save } from "lucide-react";
import { useMemo, useState } from "react";
import type { CmsContentItem } from "@/lib/cms/types";
import { defaultWhatsAppSettings, whatsappSettingsFromItem, type WhatsAppSettings } from "@/lib/cms/whatsapp";

export function WhatsAppSettingsPanel({
  initialItem,
  onSaved
}: {
  initialItem?: CmsContentItem | null;
  onSaved?: (item: CmsContentItem) => void;
}) {
  const initial = useMemo(() => whatsappSettingsFromItem(initialItem), [initialItem]);
  const [settings, setSettings] = useState(initial);
  const [id, setId] = useState(initialItem?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function patch<K extends keyof WhatsAppSettings>(key: K, value: WhatsAppSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setBusy(true);
    setMessage("جار حفظ إعدادات واتساب...");
    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id || undefined,
        type: "whatsapp",
        slug: "whatsapp-settings",
        titleAr: settings.titleAr || defaultWhatsAppSettings.titleAr,
        titleEn: settings.titleEn || defaultWhatsAppSettings.titleEn,
        summaryAr: settings.subtitleAr,
        summaryEn: settings.subtitleEn,
        bodyAr: "",
        bodyEn: "",
        category: "System",
        status: "published",
        sortOrder: 0,
        meta: settings
      })
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.item) {
      setMessage(data.message ?? "تعذر حفظ إعدادات واتساب.");
      return;
    }
    setId(data.item.id);
    onSaved?.(data.item);
    setMessage("تم حفظ إعدادات واتساب وتطبيقها على الموقع.");
  }

  return (
    <section className="dashboard-panel cms-panel cms-whatsapp-settings">
      <div className="panel-heading">
        <div>
          <h2>لوحة تحكم واتساب</h2>
          <p>الزر ثابت دائمًا في يمين الشاشة، والنافذة تظهر فوقه مباشرة. يمكنك التحكم بالمحتوى والسلوك والحجم والألوان من هنا.</p>
        </div>
        <button className="dashboard-primary" type="button" disabled={busy} onClick={() => void save()}>
          <Save size={17} /> {busy ? "جار الحفظ..." : "حفظ إعدادات واتساب"}
        </button>
      </div>

      {message && <div className="cms-message">{message}</div>}

      <div className="cms-whatsapp-layout">
        <div className="cms-whatsapp-controls">
          <section className="cms-section-settings">
            <div className="panel-heading"><div><h3>التشغيل والظهور</h3><p>تشغيل الأداة وتحديد الأجهزة والسلوك التلقائي.</p></div></div>
            <div className="cms-check-grid">
              <label className="cms-check"><input type="checkbox" checked={settings.enabled} onChange={(event) => patch("enabled", event.target.checked)} /> تفعيل واتساب</label>
              <label className="cms-check"><input type="checkbox" checked={settings.showDesktop} onChange={(event) => patch("showDesktop", event.target.checked)} /> إظهار على الكمبيوتر</label>
              <label className="cms-check"><input type="checkbox" checked={settings.showMobile} onChange={(event) => patch("showMobile", event.target.checked)} /> إظهار على الجوال</label>
              <label className="cms-check"><input type="checkbox" checked={settings.showMessageField} onChange={(event) => patch("showMessageField", event.target.checked)} /> إظهار حقل الرسالة</label>
              <label className="cms-check"><input type="checkbox" checked={settings.autoOpen} onChange={(event) => patch("autoOpen", event.target.checked)} /> فتح النافذة تلقائيًا</label>
              <label className="cms-check"><input type="checkbox" checked={settings.autoOpenOncePerSession} onChange={(event) => patch("autoOpenOncePerSession", event.target.checked)} /> مرة واحدة في الجلسة</label>
              <label className="cms-check"><input type="checkbox" checked={settings.closeOnOutside} onChange={(event) => patch("closeOnOutside", event.target.checked)} /> إغلاق عند الضغط خارجها</label>
              <label className="cms-check"><input type="checkbox" checked={settings.enablePulse} onChange={(event) => patch("enablePulse", event.target.checked)} /> حركة خفيفة حول الأيقونة</label>
            </div>
            <div className="cms-form-row">
              <label>تأخير الفتح التلقائي بالثواني<input type="number" min="0" max="120" value={settings.autoOpenDelaySeconds} onChange={(event) => patch("autoOpenDelaySeconds", Number(event.target.value))} /></label>
              <label>صفحات مخفية<textarea rows={3} value={settings.hiddenRoutes.join("\n")} onChange={(event) => patch("hiddenRoutes", event.target.value.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean))} placeholder="/privacy-policy&#10;/some-page" /></label>
            </div>
          </section>

          <section className="cms-section-settings">
            <div className="panel-heading"><div><h3>رقم واتساب والهوية</h3><p>أدخل الرقم بصيغة دولية بدون + أو مسافات.</p></div></div>
            <div className="cms-form-row">
              <label>رقم واتساب<input dir="ltr" inputMode="tel" value={settings.phone} onChange={(event) => patch("phone", event.target.value.replace(/\D+/g, ""))} placeholder="905413929436" /></label>
              <label>اسم جهة التواصل بالعربية<input value={settings.agentNameAr} onChange={(event) => patch("agentNameAr", event.target.value)} /></label>
            </div>
            <div className="cms-form-row">
              <label dir="ltr">Contact name English<input dir="ltr" value={settings.agentNameEn} onChange={(event) => patch("agentNameEn", event.target.value)} /></label>
              <label>حالة التوفر بالعربية<input value={settings.statusAr} onChange={(event) => patch("statusAr", event.target.value)} /></label>
            </div>
            <label dir="ltr">Availability English<input dir="ltr" value={settings.statusEn} onChange={(event) => patch("statusEn", event.target.value)} /></label>
          </section>

          <section className="cms-section-settings">
            <div className="panel-heading"><div><h3>نصوص النافذة</h3><p>تحكم كامل بالعربية والإنجليزية.</p></div></div>
            <div className="cms-form-row">
              <label>العنوان العربي<input value={settings.titleAr} onChange={(event) => patch("titleAr", event.target.value)} /></label>
              <label dir="ltr">English title<input dir="ltr" value={settings.titleEn} onChange={(event) => patch("titleEn", event.target.value)} /></label>
            </div>
            <div className="cms-form-row">
              <label>الوصف العربي<textarea rows={2} value={settings.subtitleAr} onChange={(event) => patch("subtitleAr", event.target.value)} /></label>
              <label dir="ltr">English description<textarea dir="ltr" rows={2} value={settings.subtitleEn} onChange={(event) => patch("subtitleEn", event.target.value)} /></label>
            </div>
            <div className="cms-form-row">
              <label>Placeholder عربي<input value={settings.placeholderAr} onChange={(event) => patch("placeholderAr", event.target.value)} /></label>
              <label dir="ltr">English placeholder<input dir="ltr" value={settings.placeholderEn} onChange={(event) => patch("placeholderEn", event.target.value)} /></label>
            </div>
            <div className="cms-form-row">
              <label>نص زر الإرسال<input value={settings.sendLabelAr} onChange={(event) => patch("sendLabelAr", event.target.value)} /></label>
              <label dir="ltr">Send button English<input dir="ltr" value={settings.sendLabelEn} onChange={(event) => patch("sendLabelEn", event.target.value)} /></label>
            </div>
          </section>

          <section className="cms-section-settings">
            <div className="panel-heading"><div><h3>الرسالة المرسلة</h3><p>حدد الرسالة الأساسية والبيانات التي تضاف معها تلقائيًا.</p></div></div>
            <div className="cms-form-row">
              <label>التحية العربية<input value={settings.greetingAr} onChange={(event) => patch("greetingAr", event.target.value)} /></label>
              <label dir="ltr">English greeting<input dir="ltr" value={settings.greetingEn} onChange={(event) => patch("greetingEn", event.target.value)} /></label>
            </div>
            <div className="cms-form-row">
              <label>الرسالة الافتراضية<textarea rows={3} value={settings.defaultMessageAr} onChange={(event) => patch("defaultMessageAr", event.target.value)} /></label>
              <label dir="ltr">Default message<textarea dir="ltr" rows={3} value={settings.defaultMessageEn} onChange={(event) => patch("defaultMessageEn", event.target.value)} /></label>
            </div>
            <div className="cms-check-grid">
              <label className="cms-check"><input type="checkbox" checked={settings.includePageContext} onChange={(event) => patch("includePageContext", event.target.checked)} /> إضافة نوع الصفحة</label>
              <label className="cms-check"><input type="checkbox" checked={settings.includePageTitle} onChange={(event) => patch("includePageTitle", event.target.checked)} /> إضافة عنوان الصفحة</label>
              <label className="cms-check"><input type="checkbox" checked={settings.includePageUrl} onChange={(event) => patch("includePageUrl", event.target.checked)} /> إضافة رابط الصفحة</label>
            </div>
          </section>

          <section className="cms-section-settings">
            <div className="panel-heading"><div><h3>الموقع والحجم</h3><p>الجهة مقفلة على اليمين حتى لا ينتقل الزر. يمكنك ضبط المسافات والحجم فقط.</p></div></div>
            <div className="cms-form-row">
              <label>المسافة من اليمين (px)<input type="number" min="8" max="120" value={settings.rightOffset} onChange={(event) => patch("rightOffset", Number(event.target.value))} /></label>
              <label>المسافة من الأسفل (px)<input type="number" min="8" max="180" value={settings.bottomOffset} onChange={(event) => patch("bottomOffset", Number(event.target.value))} /></label>
            </div>
            <div className="cms-form-row">
              <label>حجم الأيقونة (px)<input type="number" min="44" max="82" value={settings.buttonSize} onChange={(event) => patch("buttonSize", Number(event.target.value))} /></label>
              <label>عرض النافذة (px)<input type="number" min="280" max="460" value={settings.panelWidth} onChange={(event) => patch("panelWidth", Number(event.target.value))} /></label>
            </div>
            <label>المسافة بين النافذة والأيقونة (px)<input type="number" min="8" max="36" value={settings.panelGap} onChange={(event) => patch("panelGap", Number(event.target.value))} /></label>
          </section>

          <section className="cms-section-settings">
            <div className="panel-heading"><div><h3>الألوان</h3><p>اضبط الألوان بما يتوافق مع هوية الموقع.</p></div></div>
            <div className="cms-color-grid">
              {([
                ["primaryColor", "اللون الأساسي"],
                ["accentColor", "لون التمييز"],
                ["buttonColor", "خلفية الأيقونة"],
                ["buttonIconColor", "لون شعار واتساب"],
                ["panelBackground", "خلفية النافذة"],
                ["textColor", "لون النص"],
                ["mutedColor", "لون النص الثانوي"]
              ] as const).map(([key, label]) => (
                <label key={key}>{label}<span><input type="color" value={settings[key]} onChange={(event) => patch(key, event.target.value)} /><input dir="ltr" value={settings[key]} onChange={(event) => patch(key, event.target.value)} /></span></label>
              ))}
            </div>
          </section>
        </div>

        <aside className="cms-whatsapp-preview-panel">
          <span className="cms-preview-label">معاينة مباشرة</span>
          <div
            className="cms-wa-preview"
            style={{
              background: settings.panelBackground,
              color: settings.textColor,
              borderColor: settings.accentColor
            }}
          >
            <div className="cms-wa-preview-head" style={{ background: settings.primaryColor, color: "#fff" }}>
              <span className="cms-wa-preview-avatar">WA</span>
              <div><strong>{settings.agentNameAr}</strong><small>{settings.statusAr}</small></div>
            </div>
            <div className="cms-wa-preview-body">
              <strong>{settings.titleAr}</strong>
              <p style={{ color: settings.mutedColor }}>{settings.subtitleAr}</p>
              {settings.showMessageField && <textarea readOnly value={settings.defaultMessageAr} />}
              <button type="button" style={{ background: settings.accentColor, color: "#fff" }}>{settings.sendLabelAr}</button>
            </div>
          </div>
          <div className="cms-wa-fixed-note">
            <span className="cms-wa-dot" />
            الأيقونة ستبقى ثابتة في يمين الشاشة، والنافذة تفتح فوقها مباشرة.
          </div>
        </aside>
      </div>
    </section>
  );
}
