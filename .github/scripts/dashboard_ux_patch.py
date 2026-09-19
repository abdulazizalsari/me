from pathlib import Path
import re

dashboard_path = Path("app/dashboard/Dashboard.tsx")
routes_path = Path("app/dashboard/[...module]/page.tsx")
css_path = Path("app/globals.css")
editor_path = Path("app/dashboard/RichTextEditor.tsx")

dashboard = dashboard_path.read_text(encoding="utf-8")
routes = routes_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")

dashboard = dashboard.replace(
    '  LayoutDashboard,\n  LogOut,\n  Plus,',
    '  LayoutDashboard,\n  LogOut,\n  Menu,\n  Plus,\n  X,'
)
if 'import { RichTextEditor } from "./RichTextEditor";' not in dashboard:
    dashboard = dashboard.replace(
        'import type { CmsActivityLog, CmsContentItem, CmsContentType, CmsFormSubmission, CmsMediaAsset, CmsNotFoundHit, CmsRedirect, CmsRevision, CmsStatus, CmsUser } from "@/lib/cms/types";',
        'import type { CmsActivityLog, CmsContentItem, CmsContentType, CmsFormSubmission, CmsMediaAsset, CmsNotFoundHit, CmsRedirect, CmsRevision, CmsStatus, CmsUser } from "@/lib/cms/types";\nimport { RichTextEditor } from "./RichTextEditor";'
    )

nav_block = '''const navGroups: { label: string; items: typeof tabs }[] = [
  { label: "الرئيسية", items: tabs.filter((tab) => tab.type === "overview") },
  { label: "المحتوى", items: tabs.filter((tab) => ["article", "service", "course", "cv", "experience", "education", "qualification", "skill"].includes(tab.type)) },
  { label: "الصفحات", items: tabs.filter((tab) => ["homepage", "contact", "consultation", "privacy", "cta"].includes(tab.type)) },
  { label: "الوسائط", items: tabs.filter((tab) => tab.type === "media") },
  { label: "الرسائل", items: tabs.filter((tab) => tab.type === "form") },
  { label: "الإعدادات", items: tabs.filter((tab) => ["settings", "navigation", "footer", "whatsapp", "seo", "integration", "redirects", "trash"].includes(tab.type)) }
];'''
dashboard, n = re.subn(
    r'const navGroups: \{ label: string; items: typeof tabs \}\[\] = \[.*?\n\];(?=\n\nconst dashboardPaths)',
    nav_block,
    dashboard,
    flags=re.S,
)
if n != 1:
    raise SystemExit(f"navGroups replacement failed: {n}")

paths_block = '''const dashboardPaths: Partial<Record<DashboardTab, string>> = {
  overview: "/dashboard",
  article: "/dashboard/articles",
  service: "/dashboard/services",
  course: "/dashboard/courses",
  project: "/dashboard/projects",
  experience: "/dashboard/experience",
  skill: "/dashboard/skills",
  homepage: "/dashboard/pages",
  media: "/dashboard/media",
  seo: "/dashboard/seo",
  integration: "/dashboard/integrations",
  settings: "/dashboard/site-settings",
  navigation: "/dashboard/navigation",
  footer: "/dashboard/footer",
  redirects: "/dashboard/redirects",
  form: "/dashboard/forms",
  trash: "/dashboard/trash",
  cv: "/dashboard/cv",
  education: "/dashboard/education",
  qualification: "/dashboard/qualifications",
  cta: "/dashboard/cta",
  contact: "/dashboard/contact",
  consultation: "/dashboard/consultation",
  whatsapp: "/dashboard/whatsapp",
  privacy: "/dashboard/privacy"
};'''
dashboard, n = re.subn(
    r'const dashboardPaths: Partial<Record<DashboardTab, string>> = \{.*?\n\};(?=\n\nconst emptyItem)',
    paths_block,
    dashboard,
    flags=re.S,
)
if n != 1:
    raise SystemExit(f"dashboardPaths replacement failed: {n}")

state_anchor = '  const [busy, setBusy] = useState(false);\n'
if 'const [sidebarOpen, setSidebarOpen]' not in dashboard:
    dashboard = dashboard.replace(state_anchor, state_anchor + '  const [sidebarOpen, setSidebarOpen] = useState(false);\n')

dashboard = dashboard.replace(
    '  function setActiveModule(type: DashboardTab) {\n    setActive(type);\n    if (typeof window !== "undefined") window.history.pushState(null, "", dashboardPaths[type] ?? "/dashboard");\n  }',
    '  function setActiveModule(type: DashboardTab) {\n    setActive(type);\n    setSidebarOpen(false);\n    if (typeof window !== "undefined") window.history.pushState(null, "", dashboardPaths[type] ?? "/dashboard");\n  }'
)

dashboard = dashboard.replace(
    '<aside className="dashboard-sidebar cms-sidebar">',
    '<aside className={`dashboard-sidebar cms-sidebar ${sidebarOpen ? "is-open" : ""}`}>',
    1,
)
brand = '''        <div className="dashboard-brand">
          <span className="dashboard-brand-mark">ع</span>
          <span><strong>عبدالعزيز الصاري</strong><small>نظام إدارة المحتوى</small></span>
        </div>'''
brand_replacement = brand + '''
        <button className="dashboard-close" type="button" aria-label="إغلاق القائمة" onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>'''
if brand not in dashboard:
    raise SystemExit("Brand block not found")
dashboard = dashboard.replace(brand, brand_replacement, 1)

sidebar_end = '''      </aside>

      <section className="dashboard-main">'''
if sidebar_end not in dashboard:
    raise SystemExit("Sidebar end not found")
dashboard = dashboard.replace(
    sidebar_end,
    '''      </aside>
      <button className={`dashboard-overlay ${sidebarOpen ? "is-open" : ""}`} type="button" aria-label="إغلاق القائمة" onClick={() => setSidebarOpen(false)} />

      <section className="dashboard-main">''',
    1,
)

header_anchor = '''        <header className="dashboard-header cms-header">
          <div className="dashboard-search">'''
if header_anchor not in dashboard:
    raise SystemExit("Header anchor not found")
dashboard = dashboard.replace(
    header_anchor,
    '''        <header className="dashboard-header cms-header">
          <button className="dashboard-menu" type="button" aria-label="فتح قائمة لوحة التحكم" onClick={() => setSidebarOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="dashboard-search">''',
    1,
)

old_new_button = '''            <button className="dashboard-primary" type="button" onClick={() => startNew()}>
              <Plus size={18} />
              عنصر جديد
            </button>'''
new_menu = '''            <details className="cms-add-menu">
              <summary className="dashboard-primary"><Plus size={18} /> إضافة محتوى</summary>
              <div className="cms-add-menu-popover">
                <button type="button" onClick={() => startNew("article")}>مقال جديد</button>
                <button type="button" onClick={() => startNew("service")}>خدمة جديدة</button>
                <button type="button" onClick={() => startNew("course")}>دورة جديدة</button>
                <button type="button" onClick={() => setActiveModule("media")}>رفع صورة</button>
              </div>
            </details>'''
if old_new_button not in dashboard:
    raise SystemExit("Header new-item button not found")
dashboard = dashboard.replace(old_new_button, new_menu, 1)

dashboard = dashboard.replace('<Link href="/dashboard">Dashboard</Link>', '<Link href="/dashboard">لوحة التحكم</Link>')
dashboard = dashboard.replace('<span>New</span>', '<span>جديد</span>')
dashboard = dashboard.replace('<p className="dashboard-kicker">CMS عربي حقيقي</p>', '<p className="dashboard-kicker">إدارة الموقع</p>')
dashboard = dashboard.replace(
    'هذا القسم مستقل ويعرض حقوله ومحتواه فقط مع حفظ دائم في قاعدة SQLite المحلية.',
    'هذا القسم مستقل ويعرض حقوله ومحتواه فقط مع حفظ دائم وآمن في Supabase.'
)

quick_actions = '''          {active === "overview" && (
            <section className="cms-quick-actions" aria-label="إجراءات سريعة">
              <button type="button" onClick={() => startNew("article")}><FileText size={20} /><span><strong>إضافة مقال</strong><small>إنشاء رؤية جديدة</small></span></button>
              <button type="button" onClick={() => setActiveModule("media")}><Upload size={20} /><span><strong>رفع صورة</strong><small>فتح مكتبة الوسائط</small></span></button>
              <button type="button" onClick={() => startNew("service")}><BriefcaseBusiness size={20} /><span><strong>إضافة خدمة</strong><small>إنشاء خدمة جديدة</small></span></button>
              <button type="button" onClick={() => startNew("course")}><BarChart3 size={20} /><span><strong>إضافة دورة</strong><small>إنشاء دورة جديدة</small></span></button>
              <button type="button" onClick={() => setActiveModule("form")}><FileText size={20} /><span><strong>الرسائل</strong><small>{submissions.filter((submission) => submission.status === "new").length} جديدة</small></span></button>
              <a href="/" target="_blank" rel="noreferrer"><LayoutDashboard size={20} /><span><strong>مشاهدة الموقع</strong><small>فتح الواجهة العامة</small></span></a>
            </section>
          )}

'''
stats_anchor = '          <div className="dashboard-stats cms-stats">\n'
if 'className="cms-quick-actions"' not in dashboard:
    if stats_anchor not in dashboard:
        raise SystemExit("Stats anchor not found")
    dashboard = dashboard.replace(stats_anchor, quick_actions + stats_anchor, 1)

ar_old = '''                      <div className="cms-rich-toolbar" aria-label="أدوات تحرير النص العربي">
                        <button type="button" onClick={() => applyRichFormat("bodyAr", "<h2>", "</h2>")}>H2</button>
                        <button type="button" onClick={() => applyRichFormat("bodyAr", "<strong>", "</strong>")}>B</button>
                        <button type="button" onClick={() => applyRichFormat("bodyAr", "<ul><li>", "</li></ul>")}>قائمة</button>
                        <button type="button" onClick={() => applyRichFormat("bodyAr", "<blockquote>", "</blockquote>")}>اقتباس</button>
                      </div>
                      <label>المحتوى العربي<textarea rows={6} value={selected.bodyAr ?? ""} onChange={(event) => setSelected({ ...selected, bodyAr: event.target.value })} /></label>'''
ar_new = '''                      <RichTextEditor
                        label="المحتوى العربي"
                        value={selected.bodyAr ?? ""}
                        dir="rtl"
                        onChange={(bodyAr) => setSelected((current) => ({ ...current, bodyAr }))}
                      />'''
if ar_old not in dashboard:
    raise SystemExit("Arabic editor block not found")
dashboard = dashboard.replace(ar_old, ar_new, 1)

en_old = '''                      <div className="cms-rich-toolbar" aria-label="English editor tools">
                        <button type="button" onClick={() => applyRichFormat("bodyEn", "<h2>", "</h2>")}>H2</button>
                        <button type="button" onClick={() => applyRichFormat("bodyEn", "<strong>", "</strong>")}>B</button>
                        <button type="button" onClick={() => applyRichFormat("bodyEn", "<ul><li>", "</li></ul>")}>List</button>
                        <button type="button" onClick={() => applyRichFormat("bodyEn", "<blockquote>", "</blockquote>")}>Quote</button>
                      </div>
                      <label>English body<textarea dir="ltr" rows={6} value={selected.bodyEn ?? ""} onChange={(event) => setSelected({ ...selected, bodyEn: event.target.value })} /></label>'''
en_new = '''                      <RichTextEditor
                        label="English body"
                        value={selected.bodyEn ?? ""}
                        dir="ltr"
                        onChange={(bodyEn) => setSelected((current) => ({ ...current, bodyEn }))}
                      />'''
if en_old not in dashboard:
    raise SystemExit("English editor block not found")
dashboard = dashboard.replace(en_old, en_new, 1)

route_entries = '''  cv: "cv",
  education: "education",
  qualifications: "qualification",
  cta: "cta",
  contact: "contact",
  consultation: "consultation",
  whatsapp: "whatsapp",
  privacy: "privacy",'''
if '  cv: "cv",' not in routes:
    routes = routes.replace('  trash: "trash"\n};', '  trash: "trash",\n' + route_entries + '\n};')

editor_path.write_text(r'''"use client";

import { useEffect, useRef } from "react";

type RichTextEditorProps = {
  label: string;
  value: string;
  dir: "rtl" | "ltr";
  onChange: (value: string) => void;
};

export function RichTextEditor({ label, value, dir, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) editor.innerHTML = value;
  }, [value]);

  function run(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function addLink() {
    const url = window.prompt(dir === "rtl" ? "أدخل رابط الصفحة" : "Enter link URL");
    if (!url) return;
    run("createLink", url);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  return (
    <div className="cms-visual-editor" dir={dir}>
      <div className="cms-visual-editor-label">{label}</div>
      <div className="cms-visual-toolbar" role="toolbar" aria-label={dir === "rtl" ? "أدوات تنسيق المحتوى" : "Content formatting tools"}>
        <button type="button" onClick={() => run("formatBlock", "p")}>{dir === "rtl" ? "نص" : "Text"}</button>
        <button type="button" onClick={() => run("formatBlock", "h2")}>H2</button>
        <button type="button" onClick={() => run("bold")}><strong>B</strong></button>
        <button type="button" onClick={() => run("italic")}><em>I</em></button>
        <button type="button" onClick={() => run("insertUnorderedList")}>{dir === "rtl" ? "قائمة" : "List"}</button>
        <button type="button" onClick={() => run("insertOrderedList")}>1.</button>
        <button type="button" onClick={() => run("formatBlock", "blockquote")}>{dir === "rtl" ? "اقتباس" : "Quote"}</button>
        <button type="button" onClick={addLink}>{dir === "rtl" ? "رابط" : "Link"}</button>
        <button type="button" onClick={() => run(dir === "rtl" ? "justifyRight" : "justifyLeft")}>{dir === "rtl" ? "يمين" : "Left"}</button>
        <button type="button" onClick={() => run("justifyCenter")}>{dir === "rtl" ? "وسط" : "Center"}</button>
        <button type="button" onClick={() => run("removeFormat")}>{dir === "rtl" ? "مسح التنسيق" : "Clear"}</button>
        <button type="button" onClick={() => run("undo")}>{dir === "rtl" ? "تراجع" : "Undo"}</button>
        <button type="button" onClick={() => run("redo")}>{dir === "rtl" ? "إعادة" : "Redo"}</button>
      </div>
      <div
        ref={editorRef}
        className="cms-visual-editor-canvas"
        contentEditable
        suppressContentEditableWarning
        dir={dir}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onPaste={handlePaste}
      />
      <p className="cms-editor-help">
        {dir === "rtl" ? "اكتب ونسّق المحتوى كما سيظهر للزائر. لا تحتاج إلى كتابة HTML." : "Write and format content visually. No HTML editing is required."}
      </p>
    </div>
  );
}
''', encoding="utf-8")

marker = "/* Dashboard UX refresh 2026 */"
if marker not in css:
    css += r'''

/* Dashboard UX refresh 2026 */
.dashboard-shell { font-family: "DINNextLTArabicRegular", Tahoma, Arial, sans-serif; }
.dashboard-shell button, .dashboard-shell input, .dashboard-shell textarea, .dashboard-shell select { font-family: inherit; }
.dashboard-menu, .dashboard-close, .dashboard-overlay { display: none; }
.dashboard-nav-group > p { color: #7c8985; font-size: .68rem; font-weight: 800; letter-spacing: 0; text-transform: none; }
.cms-add-menu { position: relative; }
.cms-add-menu > summary { list-style: none; cursor: pointer; }
.cms-add-menu > summary::-webkit-details-marker { display: none; }
.cms-add-menu-popover { position: absolute; inset-inline-end: 0; top: calc(100% + 8px); width: 190px; padding: 8px; display: grid; gap: 5px; z-index: 60; border: 1px solid var(--dashboard-line); border-radius: 14px; background: #fff; box-shadow: 0 18px 44px rgba(0,62,70,.16); }
.cms-add-menu-popover button { border: 0; border-radius: 9px; background: transparent; padding: 10px 12px; text-align: right; color: var(--dashboard-ink); cursor: pointer; }
.cms-add-menu-popover button:hover { background: #f1f7f5; color: var(--brand-primary); }
.cms-quick-actions { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; margin: 0 0 18px; }
.cms-quick-actions > button, .cms-quick-actions > a { min-height: 86px; display: flex; align-items: center; gap: 10px; padding: 14px; border: 1px solid var(--dashboard-line); border-radius: 14px; background: #fff; color: var(--dashboard-ink); text-align: right; cursor: pointer; transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
.cms-quick-actions > button:hover, .cms-quick-actions > a:hover { transform: translateY(-2px); border-color: rgba(255,90,25,.42); box-shadow: 0 12px 28px rgba(0,62,70,.09); }
.cms-quick-actions svg { flex: 0 0 auto; color: var(--brand-orange); }
.cms-quick-actions span { display: grid; gap: 3px; }
.cms-quick-actions strong { font-size: .8rem; }
.cms-quick-actions small { color: var(--dashboard-muted); font-size: .68rem; }
.cms-visual-editor { display: grid; gap: 0; margin-top: 6px; }
.cms-visual-editor-label { margin-bottom: 7px; font-size: .78rem; font-weight: 800; color: var(--dashboard-ink); }
.cms-visual-toolbar { display: flex; flex-wrap: wrap; gap: 5px; padding: 8px; border: 1px solid var(--dashboard-line); border-bottom: 0; border-radius: 12px 12px 0 0; background: #f7faf8; }
.cms-visual-toolbar button { min-height: 32px; padding: 5px 9px; border: 1px solid #dfe8e4; border-radius: 7px; background: #fff; color: #33433f; cursor: pointer; }
.cms-visual-toolbar button:hover { border-color: var(--brand-orange); color: var(--brand-orange-dark); }
.cms-visual-editor-canvas { min-height: 260px; padding: 18px; overflow: auto; border: 1px solid var(--dashboard-line); border-radius: 0 0 12px 12px; background: #fff; color: var(--dashboard-ink); line-height: 1.9; outline: none; }
.cms-visual-editor-canvas:focus { border-color: #8ab8ad; box-shadow: 0 0 0 3px rgba(45,143,128,.12); }
.cms-visual-editor-canvas h2 { margin: 22px 0 10px; font-size: 1.35rem; }
.cms-visual-editor-canvas blockquote { margin: 16px 0; padding: 10px 14px; border-inline-start: 4px solid var(--brand-orange); background: #fff7f2; }
.cms-editor-help { margin: 7px 0 0; color: var(--dashboard-muted); font-size: .7rem; }
@media (max-width: 1180px) { .cms-quick-actions { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 850px) {
  .dashboard-shell { display: block; }
  .dashboard-sidebar { position: fixed !important; inset-block: 0; inset-inline-end: 0; width: min(86vw, 320px) !important; max-width: 320px !important; height: 100dvh !important; max-height: none !important; padding: 20px 16px !important; border: 0 !important; border-inline-start: 1px solid var(--dashboard-line) !important; z-index: 110; transform: translateX(105%) !important; transition: transform .25s ease; box-shadow: -18px 0 50px rgba(7,25,24,.16) !important; overflow-y: auto; }
  .dashboard-sidebar.is-open { transform: translateX(0) !important; }
  .dashboard-overlay { position: fixed; inset: 0; z-index: 105; border: 0; background: rgba(7,25,24,.42); backdrop-filter: blur(2px); }
  .dashboard-overlay.is-open { display: block; }
  .dashboard-menu, .dashboard-close { display: grid !important; place-items: center; width: 40px; height: 40px; flex: 0 0 40px; border: 1px solid var(--dashboard-line); border-radius: 10px; background: #fff; color: var(--brand-primary); cursor: pointer; }
  .dashboard-close { position: absolute; inset-inline-end: 14px; top: 16px; }
  .dashboard-brand { padding-inline-end: 44px; }
  .dashboard-header { flex-wrap: wrap; gap: 9px; }
  .dashboard-search { flex: 1 1 calc(100% - 50px); }
  .dashboard-header-actions { width: 100%; display: flex !important; overflow-x: auto; padding-bottom: 2px; }
  .dashboard-header-actions > * { flex: 0 0 auto; }
}
@media (max-width: 620px) {
  .cms-quick-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cms-quick-actions > button, .cms-quick-actions > a { min-height: 80px; padding: 12px; }
  .cms-visual-editor-canvas { min-height: 220px; padding: 14px; }
  .cms-visual-toolbar { gap: 4px; overflow-x: auto; flex-wrap: nowrap; }
  .cms-visual-toolbar button { flex: 0 0 auto; }
}
'''

dashboard_path.write_text(dashboard, encoding="utf-8")
routes_path.write_text(routes, encoding="utf-8")
css_path.write_text(css, encoding="utf-8")
