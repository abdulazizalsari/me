"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  ArchiveRestore,
  FileText,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  X,
  RotateCcw,
  Save,
  Search,
  Settings,
  Trash2,
  Upload,
  Waypoints
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CmsActivityLog, CmsContentItem, CmsContentType, CmsFormSubmission, CmsMediaAsset, CmsNotFoundHit, CmsRedirect, CmsRevision, CmsStatus, CmsUser } from "@/lib/cms/types";
import { RichTextEditor } from "./RichTextEditor";
import { IntegrationSettings } from "./IntegrationSettings";
import { WordPressImportPanel } from "./WordPressImportPanel";
import { BlogSettingsPanel } from "./BlogSettingsPanel";
import { WhatsAppSettingsPanel } from "./WhatsAppSettingsPanel";
import { PageManagerPanel } from "./PageManagerPanel";

const tabs: { type: "overview" | CmsContentType | "related-projects" | "page-manager" | "media" | "redirects" | "trash" | "settings" | "wordpress-import"; label: string; icon: typeof LayoutDashboard }[] = [
  { type: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { type: "article", label: "رؤى", icon: FileText },
  { type: "wordpress-import", label: "استيراد WordPress", icon: Upload },
  { type: "related-projects", label: "المشاريع ذات الصلة", icon: BriefcaseBusiness },
  { type: "blog-settings", label: "إعدادات المدونة", icon: Settings },
  { type: "service", label: "الخدمات", icon: BriefcaseBusiness },
  { type: "course", label: "الدورات", icon: BarChart3 },
  { type: "project", label: "المشاريع", icon: LayoutDashboard },
  { type: "experience", label: "الخبرات", icon: BriefcaseBusiness },
  { type: "skill", label: "المهارات", icon: BarChart3 },
  { type: "homepage", label: "محتوى الصفحات", icon: LayoutDashboard },
  { type: "page-manager", label: "إدارة الصفحات", icon: LayoutDashboard },
  { type: "media", label: "مكتبة الوسائط", icon: ImageIcon },
  { type: "seo", label: "SEO", icon: BarChart3 },
  { type: "integration", label: "التكاملات والتتبع", icon: Waypoints },
  { type: "navigation", label: "التنقل", icon: LayoutDashboard },
  { type: "footer", label: "الفوتر", icon: LayoutDashboard },
  { type: "settings", label: "إعدادات الموقع", icon: Settings },
  { type: "cv", label: "السيرة الذاتية", icon: FileText },
  { type: "education", label: "التعليم", icon: FileText },
  { type: "qualification", label: "المؤهلات", icon: FileText },
  { type: "cta", label: "الدعوات CTA", icon: FileText },
  { type: "contact", label: "صفحة التواصل", icon: FileText },
  { type: "consultation", label: "صفحة الاستشارة", icon: FileText },
  { type: "form", label: "النماذج والرسائل", icon: FileText },
  { type: "whatsapp", label: "حوار واتساب", icon: FileText },
  { type: "privacy", label: "سياسة الخصوصية", icon: FileText },
  { type: "redirects", label: "Redirects", icon: Waypoints },
  { type: "trash", label: "الأرشيف", icon: ArchiveRestore }
];

const navGroups: { label: string; items: typeof tabs }[] = [
  { label: "الرئيسية", items: tabs.filter((tab) => tab.type === "overview") },
  { label: "المحتوى", items: tabs.filter((tab) => ["article", "wordpress-import", "related-projects", "blog-settings", "service", "course", "project", "cv", "experience", "education", "qualification", "skill"].includes(tab.type)) },
  { label: "إدارة الصفحات", items: tabs.filter((tab) => tab.type === "page-manager") },
  { label: "الصفحات", items: tabs.filter((tab) => ["homepage", "contact", "consultation", "privacy", "cta"].includes(tab.type)) },
  { label: "الوسائط", items: tabs.filter((tab) => tab.type === "media") },
  { label: "الرسائل", items: tabs.filter((tab) => tab.type === "form") },
  { label: "الإعدادات", items: tabs.filter((tab) => ["settings", "navigation", "footer", "whatsapp", "seo", "integration", "redirects", "trash"].includes(tab.type)) }
];

const editorTabs = new Set<DashboardTab>(["overview", "article", "service", "course", "form", "page-manager"]);
const tabPermissions: Partial<Record<DashboardTab,string[]>> = {
 article:["articles_create","articles_edit","articles_submit","articles_publish"], service:["pages_manage"], course:["pages_manage"], project:["pages_manage"], experience:["pages_manage"], skill:["pages_manage"], homepage:["pages_manage"], "page-manager":["pages_manage"], media:["media_manage"], "related-projects":["related_projects_manage"], seo:["seo_manage"], integration:["settings_manage"], navigation:["pages_manage"], footer:["pages_manage"], settings:["settings_manage"], form:["requests_manage"], redirects:["settings_manage"], trash:["settings_manage"], "wordpress-import":["pages_manage"], "blog-settings":["pages_manage"], cv:["pages_manage"], education:["pages_manage"], qualification:["pages_manage"], cta:["pages_manage"], contact:["pages_manage"], consultation:["pages_manage"], whatsapp:["settings_manage"], privacy:["pages_manage"]
};

const advancedLinks = [
  
  { href: "/admin/translations", label: "الترجمات", icon: FileText, roles: ["admin", "editor"] as const },
  { href: "/admin/requests", label: "مركز الطلبات", icon: FileText, roles: ["admin", "editor"] as const },
  { href: "/admin/languages", label: "اللغات", icon: Settings, roles: ["admin"] as const },
  { href: "/admin/users", label: "المستخدمون", icon: Settings, roles: ["admin"] as const },
  { href: "/admin/backup", label: "النسخ الاحتياطي", icon: ArchiveRestore, roles: ["admin"] as const }
];

const dashboardPaths: Partial<Record<DashboardTab, string>> = {
  overview: "/dashboard",
  article: "/dashboard/articles",
  "wordpress-import": "/dashboard/import-wordpress",
  "related-projects": "/dashboard/related-projects",
  "blog-settings": "/dashboard/blog-settings",
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
};

const emptyItem: CmsContentItem = {
  id: "",
  type: "service",
  slug: "",
  titleAr: "",
  titleEn: "",
  summaryAr: "",
  summaryEn: "",
  bodyAr: "",
  bodyEn: "",
  category: "",
  status: "draft",
  sortOrder: 100,
  meta: {},
  createdAt: "",
  updatedAt: ""
};

type LanguageTab = "ar" | "en";
type EnglishTranslationStatus = "untranslated" | "incomplete" | "review" | "translated" | "published";
type MediaField = { key: string; label: string; altArKey: string; altEnKey: string };
type MediaPickerState = { field?: MediaField; multi?: boolean; galleryKey?: string };
type MediaCategoryFilter = "all" | "images" | "logos" | "articles" | "courses";
type ImagePlacement = "inline" | "hero" | "background" | "cover" | "gallery" | "floating";
type DashboardTab = (typeof tabs)[number]["type"];
type RichField = "bodyAr" | "bodyEn";
type ImportPreviewRow = { row: number; title: string; slug: string; status: string; category?: string; author?: string; date?: string; duplicate: boolean; valid: boolean; warnings: string[] };
type ImportSummary = { rows: number; valid: number; invalid: number; existing: number; new: number; warnings: number; images?: number };

const imagePlacementLabels: Record<ImagePlacement, string> = {
  inline: "داخل المحتوى",
  hero: "رأس الصفحة / Hero",
  background: "خلفية القسم",
  cover: "غطاء القسم",
  gallery: "ضمن معرض",
  floating: "عائمة / جانبية"
};

function mediaFieldsFor(type: CmsContentType): MediaField[] {
  if (type === "homepage") return [
    { key: "portraitImageAssetId", label: "صورة الواجهة الرئيسية", altArKey: "portraitImageAltAr", altEnKey: "portraitImageAltEn" },
    { key: "servicesBannerImageAssetId", label: "بانر الخدمات", altArKey: "servicesBannerImageAltAr", altEnKey: "servicesBannerImageAltEn" }
  ];
  if (type === "footer") return [{ key: "logoImageAssetId", label: "شعار الفوتر", altArKey: "logoImageAltAr", altEnKey: "logoImageAltEn" }];
  if (type === "navigation") return [{ key: "headerLogoImageAssetId", label: "شعار الهيدر", altArKey: "headerLogoImageAltAr", altEnKey: "headerLogoImageAltEn" }];
  if (type === "cv") return [{ key: "profileImageAssetId", label: "صورة الملف المهني", altArKey: "profileImageAltAr", altEnKey: "profileImageAltEn" }];
  return [{ key: "imageAssetId", label: "الصورة المرتبطة", altArKey: "imageAltAr", altEnKey: "imageAltEn" }];
}

const englishStatusLabels: Record<EnglishTranslationStatus, string> = {
  untranslated: "غير مترجم",
  incomplete: "ترجمة غير مكتملة",
  review: "جاهز للمراجعة",
  translated: "مترجم",
  published: "منشور"
};

const mediaCategoryFilters: { value: MediaCategoryFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "images", label: "الصور" },
  { value: "logos", label: "الشعارات" },
  { value: "articles", label: "صور المقالات" },
  { value: "courses", label: "صور الدورات" }
];

const contentTypes: CmsContentType[] = [
  "homepage", "service", "course", "project", "article", "cv", "education", "qualification", "experience", "skill",
  "navigation", "footer", "cta", "contact", "consultation", "form", "whatsapp", "integration", "seo", "privacy"
];

const homeSections = [
  { key: "hero", label: "Hero" },
  { key: "intro", label: "حول مختصر" },
  { key: "experience", label: "الخبرة" },
  { key: "services", label: "الخدمات" },
  { key: "stats", label: "الإحصائيات" },
  { key: "relatedProjects", label: "المشاريع ذات الصلة" },
  { key: "training", label: "الدورات" },
  { key: "expertise", label: "محاور الخبرة" },
  { key: "insights", label: "المقالات" },
  { key: "cta", label: "CTA" }
];

const footerNavLinks = [
  { href: "/", labelAr: "الرئيسية", labelEn: "Home" },
  { href: "/about", labelAr: "حول", labelEn: "About" },
  { href: "/services", labelAr: "الخدمات", labelEn: "Services" },
  { href: "/training", labelAr: "التدريب", labelEn: "Training" },
  { href: "/ruaa", labelAr: "رؤى", labelEn: "Insights" },
  { href: "/contact", labelAr: "اتصل بنا", labelEn: "Contact" }
];

const footerSocials = [
  { key: "instagram", label: "Instagram", href: "https://www.instagram.com/tr.abdulazizalsari/" },
  { key: "x", label: "X", href: "https://x.com/Trabdulazizsari" },
  { key: "facebook", label: "Facebook", href: "https://www.facebook.com/tr.abdulazizalsari/" },
  { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@trabdulazizalsari" }
];

const footerPresets = [
  { value: "luxury-dark", label: "فاخر داكن" },
  { value: "technical", label: "تقني" },
  { value: "simple", label: "بسيط" },
  { value: "gradient", label: "متدرج" },
  { value: "geometric", label: "هندسي" }
];

function activityActionLabel(action?: string) {
  if (action === "insert") return "إضافة";
  if (action === "update") return "تعديل";
  if (action === "delete") return "حذف";
  return "عملية";
}

function typeLabel(type: CmsContentType) {
  const labels: Record<CmsContentType, string> = {
    homepage: "قسم رئيسية",
    service: "خدمة",
    course: "دورة",
    project: "عمل",
    article: "رؤى",
    cv: "سيرة ذاتية",
    education: "تعليم",
    qualification: "مؤهل",
    experience: "خبرة",
    skill: "مهارة",
    navigation: "تنقل",
    footer: "فوتر",
    cta: "CTA",
    contact: "تواصل",
    consultation: "استشارة",
    form: "نموذج",
    whatsapp: "واتساب",
    integration: "تكامل",
    seo: "SEO",
    privacy: "سياسة الخصوصية",
    "blog-settings": "إعدادات المدونة"
  };
  return labels[type];
}

function formatMeta(meta: Record<string, unknown> | undefined) {
  return JSON.stringify(meta ?? {}, null, 2);
}

function supportsGallery(type: CmsContentType) {
  return ["homepage", "service", "course", "project", "article"].includes(type);
}

function mediaMatchesCategory(asset: CmsMediaAsset, category: MediaCategoryFilter) {
  if (category === "all" || category === "images") return true;
  const haystack = `${asset.filename} ${asset.altAr} ${asset.altEn}`.toLowerCase();
  if (category === "logos") return haystack.includes("logo") || haystack.includes("mark") || haystack.includes("شعار");
  if (category === "articles") return haystack.includes("article") || haystack.includes("insight") || haystack.includes("ruaa") || haystack.includes("مقال");
  if (category === "courses") return haystack.includes("course") || haystack.includes("training") || haystack.includes("wordpress") || haystack.includes("graphic") || haystack.includes("دورة");
  return true;
}

export function Dashboard({
  initialItems,
  initialDeletedItems,
  initialMedia,
  initialActivity,
  initialRedirects,
  initialNotFoundHits,
  initialSubmissions,
  user,
  initialActive = "overview",
  initialContentId,
  lockedActive = false
}: {
  initialItems: CmsContentItem[];
  initialDeletedItems: CmsContentItem[];
  initialMedia: CmsMediaAsset[];
  initialActivity: CmsActivityLog[];
  initialRedirects: CmsRedirect[];
  initialNotFoundHits: CmsNotFoundHit[];
  initialSubmissions: CmsFormSubmission[];
  user: CmsUser;
  initialActive?: DashboardTab;
  initialContentId?: string;
  lockedActive?: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [deletedItems, setDeletedItems] = useState(initialDeletedItems);
  const [media, setMedia] = useState(initialMedia);
  const [activity, setActivity] = useState(initialActivity);
  const [redirects, setRedirects] = useState(initialRedirects);
  const [notFoundHits] = useState(initialNotFoundHits);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [revisions, setRevisions] = useState<CmsRevision[]>([]);
  const [redirectDraft, setRedirectDraft] = useState<Partial<CmsRedirect>>({ oldUrl: "", newUrl: "", statusCode: 301, active: true });
  const [active, setActive] = useState<DashboardTab>(initialActive);
  const [selected, setSelected] = useState<CmsContentItem>({ ...emptyItem });
  const [metaText, setMetaText] = useState("{}");
  const [activeLanguage, setActiveLanguage] = useState<LanguageTab>("ar");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draggedHomeSection, setDraggedHomeSection] = useState<string | null>(null);
  const [mediaPicker, setMediaPicker] = useState<MediaPickerState | null>(null);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaCategory, setMediaCategory] = useState<MediaCategoryFilter>("all");
  const [pickerMessage, setPickerMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState("");
  const [lastAutosave, setLastAutosave] = useState("");
  const [articleImportFile, setArticleImportFile] = useState<File | null>(null);
  const [articleImportStrategy, setArticleImportStrategy] = useState<"skip" | "update" | "copy">("skip");
  const [articleImportImages, setArticleImportImages] = useState(true);
  const [articleImportPreview, setArticleImportPreview] = useState<ImportPreviewRow[]>([]);
  const [articleImportSummary, setArticleImportSummary] = useState<ImportSummary | null>(null);
  const [articleStatusFilter, setArticleStatusFilter] = useState<"all" | CmsStatus>("all");
  const [articleCategoryFilter, setArticleCategoryFilter] = useState("all");
  const [articleSort, setArticleSort] = useState<"order" | "newest" | "oldest" | "title">("newest");
  const [articleAdminPage, setArticleAdminPage] = useState(1);
  const [articleSelectedIds, setArticleSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const initialSelectionDone = useRef(false);

  const filteredItems = useMemo(() => {
    const rows = items
      .filter((item) => (contentTypes.includes(active as CmsContentType) ? item.type === active : true))
      .filter((item) => {
        const haystack = `${item.titleAr} ${item.titleEn} ${item.slug} ${item.category} ${Array.isArray(item.meta?.tags) ? item.meta.tags.join(" ") : ""}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .filter((item) => active !== "article" || articleStatusFilter === "all" || item.status === articleStatusFilter)
      .filter((item) => active !== "article" || articleCategoryFilter === "all" || item.category === articleCategoryFilter);

    if (active === "article") {
      return rows.sort((a, b) => {
        if (articleSort === "newest") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (articleSort === "oldest") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        if (articleSort === "title") return (a.titleAr || a.titleEn).localeCompare(b.titleAr || b.titleEn, "ar");
        return a.sortOrder - b.sortOrder;
      });
    }
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [active, items, query, articleStatusFilter, articleCategoryFilter, articleSort]);

  const articleAdminPageSize = 20;
  const articleAdminPages = Math.max(1, Math.ceil(filteredItems.length / articleAdminPageSize));
  const articleAdminRows = active === "article"
    ? filteredItems.slice((Math.min(articleAdminPage, articleAdminPages) - 1) * articleAdminPageSize, Math.min(articleAdminPage, articleAdminPages) * articleAdminPageSize)
    : filteredItems;
  const articleFilterCategories = useMemo(
    () => Array.from(new Set(items.filter((item) => item.type === "article").map((item) => item.category).filter((value): value is string => typeof value === "string" && Boolean(value)))).sort((a, b) => a.localeCompare(b, "ar")),
    [items]
  );

  const counts = useMemo(() => ({
    published: items.filter((item) => item.status === "published").length,
    draft: items.filter((item) => item.status === "draft").length,
    scheduled: items.filter((item) => item.status === "scheduled").length,
    archived: items.filter((item) => item.status === "archived").length,
    services: items.filter((item) => item.type === "service").length,
    media: media.length
  }), [items, media.length]);

  const pickerMedia = useMemo(() => {
    const search = mediaSearch.trim().toLowerCase();
    return media
      .filter((asset) => mediaMatchesCategory(asset, mediaCategory))
      .filter((asset) => {
        if (!search) return true;
        return `${asset.filename} ${asset.altAr} ${asset.altEn}`.toLowerCase().includes(search);
      });
  }, [media, mediaCategory, mediaSearch]);

  function ensureHomepageSelected() {
    const homepage = items.find((item) => item.type === "homepage");
    if (homepage) {
      setSelected(homepage);
      setMetaText(formatMeta(homepage.meta));
      setActiveLanguage("ar");
      setRevisions([]);
      return homepage;
    }
    return null;
  }

  function setActiveModule(type: DashboardTab) {
    setActive(type);
    setSidebarOpen(false);
    if (typeof window !== "undefined") window.history.pushState(null, "", dashboardPaths[type] ?? "/dashboard");
  }

  function startNew(type: CmsContentType = contentTypes.includes(active as CmsContentType) ? active as CmsContentType : "service") {
    const next = { ...emptyItem, type, sortOrder: items.filter((item) => item.type === type).length * 10 + 10 };
    setSelected(next);
    setMetaText("{}");
    setActiveLanguage("ar");
    setActive(type);
    setMessage("");
    setRevisions([]);
  }

  function editItem(item: CmsContentItem) {
    if (lockedActive && contentTypes.includes(active as CmsContentType) && item.type !== active) return;
    setSelected(item);
    setMetaText(formatMeta(item.meta));
    setActiveLanguage("ar");
    setActive(item.type);
    setMessage("");
    setRevisions([]);
    void loadRevisions(item.id);
  }

  useEffect(() => {
    if (initialSelectionDone.current) return;
    initialSelectionDone.current = true;
    if (!initialContentId) return;
    if (initialContentId === "new" && contentTypes.includes(initialActive as CmsContentType)) {
      startNew(initialActive as CmsContentType);
      return;
    }
    const item = initialItems.find((entry) => entry.id === initialContentId || entry.slug === initialContentId);
    if (item) editItem(item);
  // Initial route selection must run once only to avoid replacing user edits.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRevisions(id: string) {
    const response = await fetch(`/api/admin/revisions/${id}`);
    const data = await response.json().catch(() => ({}));
    if (response.ok && Array.isArray(data.revisions)) setRevisions(data.revisions);
  }

  function readMeta() {
    try {
      const parsed = JSON.parse(metaText) as Record<string, unknown>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function updateMetaField(key: string, value: unknown) {
    setMetaText(JSON.stringify({ ...readMeta(), [key]: value }, null, 2));
  }

  function updateLocalizedMetaField(key: string, locale: LanguageTab, value: string) {
    const current = readMeta()[key];
    const localized = current && typeof current === "object" && !Array.isArray(current) ? current as Record<string, unknown> : {};
    updateMetaField(key, { ...localized, [locale]: value });
  }

  function updateMetaMapField(mapKey: string, key: string, value: unknown) {
    const current = readMeta()[mapKey];
    const map = current && typeof current === "object" && !Array.isArray(current) ? current as Record<string, unknown> : {};
    updateMetaField(mapKey, { ...map, [key]: value });
  }

  function getHomeSectionSettings() {
    const configured = Array.isArray(readMeta().homeSections) ? readMeta().homeSections as Record<string, unknown>[] : [];
    return homeSections.map((section, index) => {
      const match = configured.find((entry) => entry.key === section.key);
      return {
        ...section,
        visible: match?.visible !== false,
        order: typeof match?.order === "number" ? match.order : index + 1
      };
    }).sort((a, b) => a.order - b.order);
  }

  function updateHomeSection(key: string, patch: { visible?: boolean; order?: number }) {
    const next = getHomeSectionSettings().map((section) => section.key === key ? { ...section, ...patch } : section);
    updateMetaField("homeSections", next.map((section) => ({ key: section.key, visible: section.visible, order: section.order })));
  }

  function reorderHomeSections(sourceKey: string, targetKey: string) {
    if (!sourceKey || sourceKey === targetKey) return;
    const current = getHomeSectionSettings();
    const from = current.findIndex((section) => section.key === sourceKey);
    const to = current.findIndex((section) => section.key === targetKey);
    if (from < 0 || to < 0) return;
    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateMetaField("homeSections", next.map((section, index) => ({
      key: section.key,
      visible: section.visible,
      order: index + 1
    })));
  }

  function removeMetaField(...keys: string[]) {
    const next = readMeta();
    keys.forEach((key) => delete next[key]);
    setMetaText(JSON.stringify(next, null, 2));
  }

  async function updateMedia(id: string, patch: Record<string, unknown>) {
    const response = await fetch(`/api/admin/media/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.asset) { setMessage(data.message ?? "تعذر تحديث الصورة."); return; }
    setMedia((current) => current.map((asset) => asset.id === id ? data.asset : asset));
    setMessage("تم تحديث إعدادات الصورة.");
  }

  async function removeMedia(id: string) {
    if (!window.confirm("حذف الصورة من مكتبة الوسائط؟")) return;
    const response = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 409 && Array.isArray(data.usage)) {
        const locations = data.usage.slice(0, 4).map((entry: { title?: string }) => entry.title || "عنصر مرتبط").join("، ");
        setMessage(`لا يمكن حذف الصورة لأنها مستخدمة في: ${locations}${data.usage.length > 4 ? " وغيرها" : ""}.`);
      } else {
        setMessage(data.message ?? "تعذر حذف الصورة.");
      }
      return;
    }
    setMedia((current) => current.filter((asset) => asset.id !== id));
    if (String(readMeta().imageAssetId ?? "") === id) removeMetaField("imageAssetId", "image", "imageAltAr", "imageAltEn");
    setMessage("تم حذف الصورة.");
  }

  function selectMedia(asset: CmsMediaAsset, field: MediaField) {
    const next = { ...readMeta(), [field.key]: asset.id, [field.altArKey]: asset.altAr, [field.altEnKey]: asset.altEn } as Record<string, unknown>;
    if (field.key === "imageAssetId") next.image = asset.url;
    else next[`${field.key}Url`] = asset.url;
    setMetaText(JSON.stringify(next, null, 2));
  }

  function openMediaPicker(field?: MediaField, multi = false) {
    setMediaPicker({ field, multi });
    setMediaSearch("");
    setMediaCategory("all");
    setPickerMessage("");
    setUploadProgress(null);
    setRemoteImageUrl("");
  }

  function openGalleryPicker(galleryKey: string) {
    setMediaPicker({ galleryKey, multi: true });
    setMediaSearch("");
    setMediaCategory("all");
    setPickerMessage("");
    setUploadProgress(null);
    setRemoteImageUrl("");
  }

  function galleryIds(key: string) {
    const value = readMeta()[key];
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  }

  function addMediaToGallery(asset: CmsMediaAsset, key: string) {
    setMetaText((currentText) => {
      let parsed: Record<string, unknown> = {};
      try {
        const value = JSON.parse(currentText) as Record<string, unknown>;
        parsed = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      } catch {
        parsed = {};
      }
      const current = Array.isArray(parsed[key]) ? parsed[key].filter((id): id is string => typeof id === "string") : [];
      if (current.includes(asset.id)) {
        setPickerMessage("الصورة موجودة بالفعل ضمن هذا المعرض.");
        return JSON.stringify(parsed, null, 2);
      }
      setPickerMessage("تمت إضافة الصورة إلى المعرض.");
      return JSON.stringify({ ...parsed, [key]: [...current, asset.id] }, null, 2);
    });
  }

  function removeGalleryImage(key: string, assetId: string) {
    updateMetaField(key, galleryIds(key).filter((id) => id !== assetId));
  }

  function moveGalleryImage(key: string, assetId: string, direction: -1 | 1) {
    const current = galleryIds(key);
    const index = current.indexOf(assetId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return;
    const next = [...current];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    updateMetaField(key, next);
  }

  function chooseMedia(asset: CmsMediaAsset) {
    if (mediaPicker?.galleryKey) {
      addMediaToGallery(asset, mediaPicker.galleryKey);
      return;
    }
    if (mediaPicker?.field) {
      selectMedia(asset, mediaPicker.field);
      setMediaPicker(null);
      setPickerMessage("تم اختيار الصورة بنجاح.");
      return;
    }
    setPickerMessage("الصورة جاهزة في مكتبة الوسائط.");
  }

  async function uploadMediaFile(file: File, field?: MediaField) {
    const duplicate = media.find((asset) => asset.filename === file.name && asset.sizeBytes === file.size);
    if (duplicate && window.confirm("هذه الصورة موجودة بالفعل في مكتبة الوسائط. هل تريد استخدام الصورة الموجودة؟")) {
      if (field) selectMedia(duplicate, field);
      setPickerMessage("تم استخدام الصورة الموجودة.");
      return duplicate;
    }
    setPickerMessage("");
    setUploadProgress(1);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("altAr", file.name);
    formData.append("altEn", file.name);

    const asset = await new Promise<CmsMediaAsset>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/media");
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setUploadProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
      };
      xhr.onload = () => {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300 && data.asset) resolve(data.asset);
        else reject(new Error(data.message || "تعذر رفع الصورة. حاول مرة أخرى."));
      };
      xhr.onerror = () => reject(new Error("تعذر رفع الصورة. حاول مرة أخرى."));
      xhr.send(formData);
    });

    setMedia((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
    if (field) selectMedia(asset, field);
    setUploadProgress(100);
    setPickerMessage("تم رفع الصورة بنجاح.");
    return asset;
  }

  async function handleMediaFiles(files: FileList | File[], fieldOverride?: MediaField, galleryKeyOverride?: string) {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) {
      setPickerMessage("صيغة الملف غير مدعومة.");
      return;
    }
    const targetField = fieldOverride ?? mediaPicker?.field;
    const targetGalleryKey = galleryKeyOverride ?? mediaPicker?.galleryKey;
    try {
      for (const [index, file] of imageFiles.entries()) {
        const asset = await uploadMediaFile(file, index === 0 ? targetField : undefined);
        if (targetGalleryKey) addMediaToGallery(asset, targetGalleryKey);
        if (targetField && index === 0 && !mediaPicker?.multi) {
          setMediaPicker(null);
          return asset;
        }
      }
    } catch (error) {
      setPickerMessage(error instanceof Error ? error.message : "تعذر رفع الصورة. حاول مرة أخرى.");
    } finally {
      setTimeout(() => setUploadProgress(null), 900);
    }
  }

  async function importRemoteImage() {
    if (!remoteImageUrl.trim()) {
      setPickerMessage("ألصق رابط صورة صالح أولاً.");
      return;
    }
    setPickerMessage("");
    setUploadProgress(1);
    const formData = new FormData();
    formData.append("remoteUrl", remoteImageUrl.trim());
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.asset) throw new Error(data.message || "تعذر استيراد الصورة من الرابط.");
      setMedia((current) => [data.asset, ...current.filter((item) => item.id !== data.asset.id)]);
      if (mediaPicker?.galleryKey) {
        addMediaToGallery(data.asset, mediaPicker.galleryKey);
      } else if (mediaPicker?.field) {
        selectMedia(data.asset, mediaPicker.field);
        setMediaPicker(null);
      }
      setRemoteImageUrl("");
      setPickerMessage("تم استيراد الصورة بنجاح.");
    } catch (error) {
      setPickerMessage(error instanceof Error ? error.message : "تعذر استيراد الصورة من الرابط.");
    } finally {
      setUploadProgress(null);
    }
  }

  useEffect(() => {
    if (!mediaPicker) return;
    function onPaste(event: ClipboardEvent) {
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
      if (!files.length) return;
      event.preventDefault();
      void handleMediaFiles(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  // Paste support is active only while the picker is open; re-registering on picker changes keeps the selected field current.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaPicker]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!selected.titleAr && !selected.slug && metaText === "{}") return;
      window.localStorage.setItem("cms-autosave", JSON.stringify({ selected, metaText, savedAt: new Date().toISOString() }));
      setLastAutosave(new Date().toLocaleTimeString("ar"));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [selected, metaText]);

  function restoreLocalAutosave() {
    const raw = window.localStorage.getItem("cms-autosave");
    if (!raw) {
      setMessage("لا توجد مسودة محفوظة تلقائياً في هذا المتصفح.");
      return;
    }
    const draft = JSON.parse(raw) as { selected?: CmsContentItem; metaText?: string };
    if (draft.selected) setSelected(draft.selected);
    if (draft.metaText) setMetaText(draft.metaText);
    setMessage("تم استرجاع آخر مسودة محفوظة تلقائياً.");
  }

  function applyRichFormat(field: RichField, before: string, after = before) {
    const current = selected[field] ?? "";
    setSelected({ ...selected, [field]: `${current}${current ? "\n" : ""}${before}النص${after}` });
  }

  function updateImageSetting(field: MediaField, key: string, value: string) {
    updateMetaField(`${field.key}_${key}`, value);
  }

  function getEnglishStatus(): EnglishTranslationStatus {
    const meta = readMeta();
    const explicit = meta.englishStatus;
    if (typeof explicit === "string" && explicit in englishStatusLabels) return explicit as EnglishTranslationStatus;
    if (!selected.titleEn.trim() && !selected.summaryEn.trim() && !selected.bodyEn?.trim()) return "untranslated";
    if (!selected.titleEn.trim() || !selected.summaryEn.trim() || !selected.bodyEn?.trim()) return "incomplete";
    return "review";
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...selected, type: lockedActive && contentTypes.includes(active as CmsContentType) ? active : selected.type, metaText })
    });
    const data = await response.json().catch(() => ({ message: "تعذر حفظ المحتوى." }));
    setBusy(false);

    if (!response.ok || !data.item) {
      setMessage(data.message ?? "تعذر حفظ المحتوى.");
      return;
    }

    setItems((current) => {
      const without = current.filter((item) => item.id !== data.item.id);
      return [...without, data.item].sort((a, b) => a.sortOrder - b.sortOrder);
    });
    setSelected(data.item);
    setMetaText(formatMeta(data.item.meta));
    setActivity((current) => [{ id: crypto.randomUUID(), event: `Saved ${data.item.type}: ${data.item.titleAr || data.item.titleEn || data.item.slug}`, createdAt: new Date().toISOString() }, ...current].slice(0, 30));
    setMessage("تم حفظ المحتوى بنجاح.");
  }

  async function deleteItem(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!id || !window.confirm("هل تريد حذف هذا العنصر؟")) return;
    const response = await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("تعذر حذف العنصر.");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
    if (item) setDeletedItems((current) => [{ ...item, status: "archived" }, ...current.filter((entry) => entry.id !== id)]);
    setSelected({ ...emptyItem });
    setMetaText("{}");
    if (item) setActivity((current) => [{ id: crypto.randomUUID(), event: `Archived ${item.type}: ${item.titleAr || item.titleEn || item.slug}`, createdAt: new Date().toISOString() }, ...current].slice(0, 30));
    setMessage("تم حذف العنصر.");
  }

  async function restoreItem(id: string) {
    const response = await fetch(`/api/admin/trash/${id}`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.item) {
      setMessage(data.message ?? "تعذر استرجاع العنصر.");
      return;
    }
    setDeletedItems((current) => current.filter((item) => item.id !== id));
    setItems((current) => [data.item, ...current.filter((item) => item.id !== id)]);
    editItem(data.item);
    setMessage("تم استرجاع العنصر كمسودة.");
  }

  async function restoreRevision(revisionId: string) {
    if (!selected.id || !window.confirm("استرجاع هذه النسخة السابقة؟ سيتم حفظ نسخة من الوضع الحالي قبل الاسترجاع.")) return;
    const response = await fetch(`/api/admin/revisions/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.item) {
      setMessage(data.message ?? "تعذر استرجاع النسخة.");
      return;
    }
    setItems((current) => [data.item, ...current.filter((item) => item.id !== data.item.id)]);
    editItem(data.item);
    setMessage("تم استرجاع النسخة السابقة.");
  }

  async function saveRedirectRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/redirects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(redirectDraft)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.redirect) {
      setMessage(data.message ?? "تعذر حفظ التحويل.");
      return;
    }
    setRedirects((current) => [data.redirect, ...current.filter((rule) => rule.id !== data.redirect.id && rule.oldUrl !== data.redirect.oldUrl)]);
    setRedirectDraft({ oldUrl: "", newUrl: "", statusCode: 301, active: true });
    setMessage("تم حفظ التحويل.");
  }

  async function deleteRedirectRule(id: string) {
    const response = await fetch(`/api/admin/redirects/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("تعذر حذف التحويل.");
      return;
    }
    setRedirects((current) => current.filter((rule) => rule.id !== id));
  }

  async function updateSubmission(id: string, patch: Partial<CmsFormSubmission>) {
    const response = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.submission) {
      setMessage(data.message ?? "تعذر تحديث الرسالة.");
      return;
    }
    setSubmissions((current) => current.map((submission) => submission.id === id ? data.submission : submission));
  }

  async function uploadMedia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/media", { method: "POST", body: formData });
    const data = await response.json().catch(() => ({ message: "تعذر رفع الملف." }));
    setBusy(false);
    if (!response.ok || !data.asset) {
      setMessage(data.message ?? "تعذر رفع الملف.");
      return;
    }
    setMedia((current) => [data.asset, ...current]);
    form.reset();
    setMessage("تم رفع الصورة وحفظها في مكتبة الوسائط.");
  }

  async function runArticleImport(action: "preview" | "import") {
    if (!articleImportFile) {
      setMessage("اختر ملف WordPress XML/WXR أو XLSX/CSV أولاً.");
      return;
    }
    const formData = new FormData();
    formData.append("file", articleImportFile);
    formData.append("action", action);
    formData.append("duplicateStrategy", articleImportStrategy);
    formData.append("importImages", String(articleImportImages));
    setBusy(true);
    setMessage(action === "preview" ? "جار فحص الملف..." : "جار استيراد المقالات...");
    const response = await fetch("/api/admin/articles/import-export", { method: "POST", body: formData });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.ok) {
      setMessage(data.message ?? "تعذر تنفيذ العملية.");
      return;
    }
    if (action === "preview") {
      setArticleImportSummary(data.summary ?? null);
      setArticleImportPreview(Array.isArray(data.preview) ? data.preview : []);
      setMessage(data.sourceFormat === "wordpress-wxr" ? "تمت قراءة ملف WordPress بنجاح. راجع المقالات قبل الاستيراد." : "تم فحص الملف. راجع المعاينة قبل الاستيراد.");
      return;
    }
    const result = data.result as { imported?: number; updated?: number; skipped?: number; failed?: number; errors?: string[]; imagesImported?: number; imagesFailed?: number; imageErrors?: string[] } | undefined;
    setMessage(`تم الاستيراد: جديد ${result?.imported ?? 0}، تحديث ${result?.updated ?? 0}، متجاوز ${result?.skipped ?? 0}، فشل ${result?.failed ?? 0}، صور محفوظة ${result?.imagesImported ?? 0}، صور تعذر حفظها ${result?.imagesFailed ?? 0}.`);
    setArticleImportPreview([]);
    setArticleImportSummary(null);
    window.location.reload();
  }

  async function runArticleBulk(action: "publish" | "draft" | "archive" | "changeCategory") {
    if (!articleSelectedIds.length) {
      setMessage("حدد مقالاً واحداً على الأقل.");
      return;
    }
    let category = "";
    if (action === "changeCategory") {
      category = window.prompt("اكتب اسم التصنيف الجديد:")?.trim() ?? "";
      if (!category) return;
    }
    if (action === "archive" && !window.confirm(`نقل ${articleSelectedIds.length} مقالاً إلى الأرشيف؟ يمكن استرجاعها لاحقاً.`)) return;

    setBusy(true);
    const response = await fetch("/api/admin/articles/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: articleSelectedIds, action, category })
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.ok) {
      setMessage(data.message ?? "تعذر تنفيذ الإجراء الجماعي.");
      return;
    }
    setArticleSelectedIds([]);
    setMessage(`تم تحديث ${data.updated ?? 0} مقالاً${data.skipped ? `، وتم تجاوز ${data.skipped}` : ""}.`);
    window.location.reload();
  }

  function dropMedia(event: React.DragEvent<HTMLFormElement>) {
    event.preventDefault();
    const fileInput = event.currentTarget.elements.namedItem("file");
    if (!(fileInput instanceof HTMLInputElement) || !event.dataTransfer.files.length) return;
    const transfer = new DataTransfer();
    transfer.items.add(event.dataTransfer.files[0]);
    fileInput.files = transfer.files;
    event.currentTarget.requestSubmit();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/dashboard/login";
  }

  const activeIsContent = contentTypes.includes(active as CmsContentType) && active !== "integration" && active !== "whatsapp";
  const canUse = (type: DashboardTab) => {
    if (user.role === "admin") return true;
    if (type === "overview") return true;
    if (type === "article") return user.permissions.some((p) => tabPermissions.article?.includes(p));
    if (user.role === "editor" && editorTabs.has(type)) return true;
    return Boolean(tabPermissions[type]?.some((p) => user.permissions.includes(p)));
  };
  const visibleNavGroups = navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => canUse(item.type)) }))
    .filter((group) => group.items.length > 0);
  const visibleAdvancedLinks = advancedLinks.filter((item) => item.roles.some((role) => role === user.role) && (user.role === "admin" || (item.href === "/admin/translations" ? user.permissions.includes("pages_manage") : item.href === "/admin/requests" ? user.permissions.includes("requests_manage") : item.href === "/admin/languages" ? user.permissions.includes("languages_manage") : item.href === "/admin/users" ? user.permissions.includes("users_manage") : item.href === "/admin/backup" ? user.permissions.includes("settings_manage") : false)));
  const integrationItem = items.find((item) => item.type === "integration" && item.slug === "site-integrations") ?? items.find((item) => item.type === "integration");
  const whatsappItem = items.find((item) => item.type === "whatsapp" && item.slug === "whatsapp-settings") ?? items.find((item) => item.type === "whatsapp");
  const blogSettingsItem = items.find((item) => item.type === "blog-settings" && item.slug === "blog-settings") ?? items.find((item) => item.type === "blog-settings");
  const blogCategories = Array.isArray(blogSettingsItem?.meta?.categories) ? blogSettingsItem.meta.categories.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry) && entry.enabled !== false) : [];


  async function sendArticleForReview() {
    if (selected.type !== "article" || !selected.id) {
      setMessage("احفظ المقال أولاً ثم أرسله للمراجعة.");
      return;
    }
    setBusy(true);
    setMessage("");
    let meta: Record<string, unknown> = {};
    try { meta = metaText.trim() ? JSON.parse(metaText) : {}; } catch { setBusy(false); setMessage("بيانات المقال الإضافية غير صحيحة."); return; }
    meta = { ...meta, workflowStatus: "pending_review", submittedForReviewAt: new Date().toISOString(), submittedBy: user.id };
    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...selected, status: "draft", metaText: JSON.stringify(meta) })
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.item) { setMessage(data.message ?? "تعذر إرسال المقال للمراجعة."); return; }
    setItems((current) => [...current.filter((item) => item.id !== data.item.id), data.item].sort((a,b)=>a.sortOrder-b.sortOrder));
    setSelected(data.item);
    setMetaText(formatMeta(data.item.meta));
    setMessage("تم إرسال المقال إلى قائمة المراجعة والنشر.");
  }

  async function publishArticle() {
    if (selected.type !== "article" || !selected.id) return;
    setBusy(true);
    setMessage("");
    let meta: Record<string, unknown> = {};
    try { meta = metaText.trim() ? JSON.parse(metaText) : {}; } catch { setBusy(false); setMessage("بيانات المقال الإضافية غير صحيحة."); return; }
    meta = { ...meta, workflowStatus: "published", publishedAt: new Date().toISOString(), publishedBy: user.id };
    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...selected, status: "published", metaText: JSON.stringify(meta) })
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.item) { setMessage(data.message ?? "تعذر نشر المقال."); return; }
    setItems((current) => [...current.filter((item) => item.id !== data.item.id), data.item].sort((a,b)=>a.sortOrder-b.sortOrder));
    setSelected(data.item);
    setMetaText(formatMeta(data.item.meta));
    setMessage("تم نشر المقال بنجاح.");
  }

  return (
    <main className={`dashboard-shell cms-shell role-${user.role}`} dir="rtl">
      <aside className={`dashboard-sidebar cms-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="dashboard-brand">
          <span className="dashboard-brand-mark">ع</span>
          <span><strong>عبدالعزيز الصاري</strong><small>{user.role === "admin" ? "لوحة المدير" : user.role === "assistant" ? "لوحة المساعد" : user.role === "editor" ? "لوحة المحرر" : user.role === "writer" ? "لوحة الكاتب" : "لوحة المراجع والناشر"}</small></span>
        </div>
        <button className="dashboard-close" type="button" aria-label="إغلاق القائمة" onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>
        <nav className="dashboard-nav" aria-label="تنقل لوحة التحكم">
          {visibleNavGroups.map((group) => (
            <div className="dashboard-nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map(({ type, label, icon: Icon }) => (
                <a key={type} href={dashboardPaths[type] ?? "/dashboard"} className={active === type ? "active" : ""} onClick={(event) => { event.preventDefault(); setActiveModule(type); }}>
                  <Icon size={18} />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          ))}
          <div className="dashboard-nav-group">
            <p>إدارة متقدمة</p>
            {visibleAdvancedLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </nav>
        <div className="sidebar-profile">
          <span className="profile-avatar">ع</span>
          <span><strong>{user.email}</strong><small>{user.role === "admin" ? "مدير الموقع" : "محرر"}</small></span>
        </div>
      </aside>
      <button className={`dashboard-overlay ${sidebarOpen ? "is-open" : ""}`} type="button" aria-label="إغلاق القائمة" onClick={() => setSidebarOpen(false)} />

      <section className="dashboard-main">
        <header className="dashboard-header cms-header">
          <button className="dashboard-menu" type="button" aria-label="فتح قائمة لوحة التحكم" onClick={() => setSidebarOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="dashboard-search">
            <Search size={18} />
            <input aria-label="بحث في المحتوى" placeholder="ابحث في العنوان أو الرابط أو التصنيف" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="dashboard-header-actions">
            <button className="cms-ghost-button" type="button" onClick={restoreLocalAutosave}>
              <RotateCcw size={17} />
              استرجاع Autosave
            </button>
            <details className="cms-add-menu">
              <summary className="dashboard-primary"><Plus size={18} /> إضافة محتوى</summary>
              <div className="cms-add-menu-popover">
                <button type="button" onClick={() => startNew("article")}>مقال جديد</button>
                <button type="button" onClick={() => startNew("service")}>خدمة جديدة</button>
                <button type="button" onClick={() => startNew("course")}>دورة جديدة</button>
                {user.role === "admin" && <button type="button" onClick={() => setActiveModule("media")}>رفع صورة</button>}
              </div>
            </details>
            <button className="cms-ghost-button" type="button" onClick={logout}>
              <LogOut size={18} />
              خروج
            </button>
          </div>
        </header>

        <div className="dashboard-content cms-content">
          <div className="dashboard-intro">
            <div>
              <nav className="cms-breadcrumbs" aria-label="مسار لوحة التحكم">
                <Link href="/dashboard">لوحة التحكم</Link>
                {active !== "overview" && <span>{tabs.find((tab) => tab.type === active)?.label}</span>}
                {selected.id && activeIsContent && <span>{selected.titleAr || selected.titleEn || selected.slug}</span>}
                {!selected.id && initialContentId === "new" && activeIsContent && <span>جديد</span>}
              </nav>
              <p className="dashboard-kicker">إدارة الموقع</p>
              <h1>{active === "overview" ? "لوحة إدارة المحتوى" : tabs.find((tab) => tab.type === active)?.label}</h1>
              <p>{active === "overview" ? "نظرة عامة على حالة المحتوى والنشاط دون تحرير مباشر." : active === "wordpress-import" ? "استيراد مقالات WordPress من ملف WXR/XML مع الصور والبيانات المرتبطة بها." : active === "blog-settings" ? "إدارة مركزية لصفحة رؤى والتصنيفات والوسوم وعناصر صفحة المقال." : active === "whatsapp" ? "إدارة كاملة لأيقونة واتساب والنافذة والرسائل والألوان والظهور من مكان واحد." : "هذا القسم مستقل ويعرض حقوله ومحتواه فقط مع حفظ دائم وآمن في Supabase."}</p>
              {lastAutosave && <p className="cms-form-note">آخر Autosave محلي: {lastAutosave}</p>}
            </div>
          </div>

          {message && <div className="cms-message">{message}</div>}

          {active === "overview" && (
            <section className="cms-quick-actions" aria-label="إجراءات سريعة">
              <button type="button" onClick={() => startNew("article")}><FileText size={20} /><span><strong>إضافة مقال</strong><small>إنشاء رؤية جديدة</small></span></button>
              <button type="button" onClick={() => setActiveModule("media")}><Upload size={20} /><span><strong>رفع صورة</strong><small>فتح مكتبة الوسائط</small></span></button>
              <button type="button" onClick={() => startNew("service")}><BriefcaseBusiness size={20} /><span><strong>إضافة خدمة</strong><small>إنشاء خدمة جديدة</small></span></button>
              <button type="button" onClick={() => startNew("course")}><BarChart3 size={20} /><span><strong>إضافة دورة</strong><small>إنشاء دورة جديدة</small></span></button>
              <button type="button" onClick={() => setActiveModule("form")}><FileText size={20} /><span><strong>الرسائل</strong><small>{submissions.filter((submission) => submission.status === "new").length} جديدة</small></span></button>
              <a href="/" target="_blank" rel="noreferrer"><LayoutDashboard size={20} /><span><strong>مشاهدة الموقع</strong><small>فتح الواجهة العامة</small></span></a>
            </section>
          )}

{active !== "wordpress-import" && active !== "blog-settings" && active !== "whatsapp" && (
          <div className="dashboard-stats cms-stats">
            <article className="dashboard-stat"><div><span>منشور</span><strong>{counts.published}</strong></div></article>
            <article className="dashboard-stat"><div><span>مسودات</span><strong>{counts.draft}</strong></div></article>
            <article className="dashboard-stat"><div><span>مجدول</span><strong>{counts.scheduled}</strong></div></article>
            <article className="dashboard-stat"><div><span>مؤرشف</span><strong>{counts.archived}</strong></div></article>
            <article className="dashboard-stat"><div><span>خدمات</span><strong>{counts.services}</strong></div></article>
            <article className="dashboard-stat"><div><span>وسائط</span><strong>{counts.media}</strong></div></article>
          </div>
          )}

          {active === "wordpress-import" && <WordPressImportPanel />}

          {active === "blog-settings" && <BlogSettingsPanel initialItem={items.find((item) => item.type === "blog-settings") ?? null} media={media} />}

          {active === "whatsapp" && <WhatsAppSettingsPanel initialItem={whatsappItem ?? null} onSaved={(item) => setItems((current) => [item, ...current.filter((entry) => entry.id !== item.id && entry.type !== "whatsapp")])} />}

          {active === "overview" && (
            <section className="dashboard-panel cms-panel">
              <div className="panel-heading"><div><h2>آخر العناصر</h2><p>اختر أي عنصر لبدء التحرير.</p></div></div>
              <ContentTable items={filteredItems.slice(0, 12)} onEdit={editItem} onDelete={deleteItem} />
              <div className="cms-activity-log">
                <h3>سجل التعديلات</h3>
                {activity.length ? activity.slice(0, 8).map((entry) => (
                  <p key={entry.id}>
                    <span>{new Date(entry.createdAt).toLocaleString("ar")}</span>
                    <strong>{entry.action ? activityActionLabel(entry.action) : "نشاط"}</strong>
                    <span>{entry.entityType || ""}{entry.entityId ? ` · ${entry.entityId}` : ""}</span>
                    <span>{entry.actorEmail || "النظام"}</span>
                    {!entry.entityType && <span>{entry.event}</span>}
                  </p>
                )) : <p><span>-</span>لا توجد تعديلات مسجلة بعد.</p>}
              </div>
            </section>
          )}

          {active === "form" && (
            <section className="dashboard-panel cms-panel cms-submissions-panel">
              <div className="panel-heading"><div><h2>رسائل النماذج والاستشارات</h2><p>بحث وفلترة وتحديث حالة الرسائل مع ملاحظات داخلية.</p></div></div>
              <div className="cms-submission-grid">
                {submissions
                  .filter((submission) => `${submission.name} ${submission.email} ${submission.phone} ${submission.message} ${submission.source}`.toLowerCase().includes(query.toLowerCase()))
                  .map((submission) => (
                    <article key={submission.id} className="cms-submission-card">
                      <div>
                        <strong>{submission.name}</strong>
                        <span>{new Date(submission.createdAt).toLocaleString("ar")} · {submission.source}</span>
                      </div>
                      <p>{submission.message}</p>
                      <a dir="ltr" href={`mailto:${submission.email}`}>{submission.email}</a>
                      <a dir="ltr" href={`tel:${submission.phone}`}>{submission.phone}</a>
                      <div className="cms-form-row">
                        <label>الحالة<select value={submission.status} onChange={(event) => updateSubmission(submission.id, { status: event.target.value as CmsFormSubmission["status"] })}><option value="new">جديد</option><option value="in_progress">قيد المتابعة</option><option value="done">تم</option><option value="archived">مؤرشف</option></select></label>
                        <label>ملاحظات داخلية<input value={submission.notes} onChange={(event) => updateSubmission(submission.id, { notes: event.target.value })} /></label>
                      </div>
                    </article>
                  ))}
                {!submissions.length && <p className="cms-form-note">لا توجد رسائل محفوظة بعد.</p>}
              </div>
            </section>
          )}

          {activeIsContent && (
            <div className="cms-editor-grid">
              <section className="dashboard-panel cms-panel">
                <div className="panel-heading">
                  <div><h2>{typeLabel(active as CmsContentType)}: العناصر</h2><p>النشر والمسودات والترتيب محفوظة في قاعدة البيانات.</p></div>
                  <button className="dashboard-primary" type="button" onClick={() => startNew(active as CmsContentType)}><Plus size={17} /> جديد</button>
                </div>
                {active === "article" && <div className="cms-article-admin-toolbar">
                  <select aria-label="فلترة الحالة" value={articleStatusFilter} onChange={(event) => { setArticleStatusFilter(event.target.value as "all" | CmsStatus); setArticleAdminPage(1); }}>
                    <option value="all">كل الحالات</option>
                    <option value="published">منشور</option>
                    <option value="draft">مسودة</option>
                    <option value="scheduled">مجدول</option>
                    <option value="archived">مؤرشف</option>
                  </select>
                  <select aria-label="فلترة التصنيف" value={articleCategoryFilter} onChange={(event) => { setArticleCategoryFilter(event.target.value); setArticleAdminPage(1); }}>
                    <option value="all">كل التصنيفات</option>
                    {articleFilterCategories.map((category) => <option value={category} key={category}>{category}</option>)}
                  </select>
                  <select aria-label="ترتيب المقالات" value={articleSort} onChange={(event) => setArticleSort(event.target.value as typeof articleSort)}>
                    <option value="newest">الأحدث تعديلاً</option>
                    <option value="oldest">الأقدم</option>
                    <option value="title">العنوان</option>
                    <option value="order">الترتيب اليدوي</option>
                  </select>
                  <span className="cms-selection-count">{articleSelectedIds.length} محدد</span>
                  <button className="cms-ghost-button" type="button" disabled={busy || !articleSelectedIds.length} onClick={() => void runArticleBulk("publish")}>نشر</button>
                  <button className="cms-ghost-button" type="button" disabled={busy || !articleSelectedIds.length} onClick={() => void runArticleBulk("draft")}>مسودة</button>
                  <button className="cms-ghost-button" type="button" disabled={busy || !articleSelectedIds.length} onClick={() => void runArticleBulk("changeCategory")}>تغيير التصنيف</button>
                  <button className="cms-danger-button" type="button" disabled={busy || !articleSelectedIds.length} onClick={() => void runArticleBulk("archive")}>أرشفة</button>
                </div>}
                <ContentTable
                  items={active === "article" ? articleAdminRows : filteredItems}
                  onEdit={editItem}
                  onDelete={deleteItem}
                  selectable={active === "article"}
                  selectedIds={articleSelectedIds}
                  onSelectionChange={setArticleSelectedIds}
                />
                {active === "article" && articleAdminPages > 1 && <div className="cms-admin-pagination">
                  <button type="button" disabled={articleAdminPage <= 1} onClick={() => setArticleAdminPage((page) => Math.max(1, page - 1))}>السابق</button>
                  <span>صفحة {Math.min(articleAdminPage, articleAdminPages)} من {articleAdminPages}</span>
                  <button type="button" disabled={articleAdminPage >= articleAdminPages} onClick={() => setArticleAdminPage((page) => Math.min(articleAdminPages, page + 1))}>التالي</button>
                </div>}
              </section>

              <section className="dashboard-panel cms-panel">
                <div className="panel-heading"><div><h2>{selected.id ? "تحرير المحتوى" : "محتوى جديد"}</h2><p>استخدم JSON للحقول الإضافية مثل icon أو year أو services.</p></div></div>
                <form id="cms-content-form" className="cms-form" onSubmit={saveItem}>
                  <div className="cms-form-row">
                    {lockedActive ? <label>نوع المحتوى<input value={typeLabel(selected.type)} readOnly /></label> : <label>النوع<select value={selected.type} onChange={(event) => setSelected({ ...selected, type: event.target.value as CmsContentType })}>{contentTypes.map((type) => <option value={type} key={type}>{typeLabel(type)}</option>)}</select></label>}
                    <label>الحالة<select value={selected.status} onChange={(event) => setSelected({ ...selected, status: event.target.value as CmsStatus })}><option value="draft">مسودة</option><option value="published">منشور</option><option value="scheduled">مجدول</option><option value="archived">مؤرشف</option></select></label>
                  </div>
                  <label>الرابط المختصر<input value={selected.slug} onChange={(event) => setSelected({ ...selected, slug: event.target.value })} required /></label>
                  <div className="cms-language-tabs" role="tablist" aria-label="لغات المحتوى">
                    <button type="button" className={activeLanguage === "ar" ? "active" : ""} onClick={() => setActiveLanguage("ar")}>
                      <strong>العربية</strong>
                      <span>اللغة الأساسية</span>
                    </button>
                    <button type="button" className={activeLanguage === "en" ? "active" : ""} onClick={() => setActiveLanguage("en")}>
                      <strong>English</strong>
                      <span>ترجمة</span>
                    </button>
                  </div>
                  <div className="cms-translation-status">
                    <span>العربية: {selected.status === "published" ? "منشور" : "مسودة"}</span>
                    <span>English: {englishStatusLabels[getEnglishStatus()]}</span>
                  </div>
                  {activeLanguage === "ar" ? (
                    <div className="cms-language-panel" role="tabpanel">
                      <label>العنوان العربي<input value={selected.titleAr} onChange={(event) => setSelected({ ...selected, titleAr: event.target.value })} required /></label>
                      <label>الملخص العربي<textarea rows={3} value={selected.summaryAr} onChange={(event) => setSelected({ ...selected, summaryAr: event.target.value })} /></label>
                      <RichTextEditor
                        label="المحتوى العربي"
                        value={selected.bodyAr ?? ""}
                        dir="rtl"
                        allowSource={user.role === "admin"}
                        onChange={(bodyAr) => setSelected((current) => ({ ...current, bodyAr }))}
                      />
                    </div>
                  ) : (
                    <div className="cms-language-panel" role="tabpanel" dir="ltr">
                      <label>English title<input dir="ltr" value={selected.titleEn} onChange={(event) => setSelected({ ...selected, titleEn: event.target.value })} /></label>
                      <label>English summary<textarea dir="ltr" rows={3} value={selected.summaryEn} onChange={(event) => setSelected({ ...selected, summaryEn: event.target.value })} /></label>
                      <RichTextEditor
                        label="English body"
                        value={selected.bodyEn ?? ""}
                        dir="ltr"
                        allowSource={user.role === "admin"}
                        onChange={(bodyEn) => setSelected((current) => ({ ...current, bodyEn }))}
                      />
                      <label>English translation status<select value={getEnglishStatus()} onChange={(event) => updateMetaField("englishStatus", event.target.value)}>
                        {Object.entries(englishStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                      </select></label>
                      <p className="cms-form-note" dir="rtl">الترجمة التي يتم توليدها أو إدخالها تبقى مسودة حتى يتم اختيار حالة &quot;منشور&quot; للإنجليزية.</p>
                    </div>
                  )}
                  <div className="cms-form-row">
                    <label>التصنيف<input list={selected.type === "article" ? "blog-category-options" : undefined} value={selected.category ?? ""} onChange={(event) => setSelected({ ...selected, category: event.target.value })} /></label>
                    {selected.type === "article" && <datalist id="blog-category-options">{blogCategories.map((entry, index) => <option value={String(entry.nameAr ?? entry.nameEn ?? "")} key={String(entry.slug ?? index)} />)}</datalist>}
                    <label>الترتيب<input type="number" value={selected.sortOrder} onChange={(event) => setSelected({ ...selected, sortOrder: Number(event.target.value) })} /></label>
                  </div>
                  <div className="cms-section-settings">
                    <div className="panel-heading"><div><h3>SEO داخلي</h3><p>العنوان والوصف والصور الاجتماعية و Schema محفوظة ضمن Meta.</p></div></div>
                    <div className="cms-form-row">
                      <label>SEO Title<input value={String(readMeta().seoTitle ?? "")} onChange={(event) => updateMetaField("seoTitle", event.target.value)} maxLength={70} /></label>
                      <label>Canonical URL<input dir="ltr" value={String(readMeta().canonicalUrl ?? "")} onChange={(event) => updateMetaField("canonicalUrl", event.target.value)} placeholder="/services/example" /></label>
                    </div>
                    <label>Meta Description<textarea rows={2} value={String(readMeta().metaDescription ?? "")} onChange={(event) => updateMetaField("metaDescription", event.target.value)} maxLength={160} /></label>
                    <div className="cms-form-row">
                      <label>Open Graph Title<input value={String(readMeta().ogTitle ?? "")} onChange={(event) => updateMetaField("ogTitle", event.target.value)} /></label>
                      <label>Open Graph Image<input dir="ltr" value={String(readMeta().ogImage ?? "")} onChange={(event) => updateMetaField("ogImage", event.target.value)} /></label>
                    </div>
                    <label>Open Graph Description<textarea rows={2} value={String(readMeta().ogDescription ?? "")} onChange={(event) => updateMetaField("ogDescription", event.target.value)} /></label>
                    <div className="cms-form-row">
                      <label>Twitter Image<input dir="ltr" value={String(readMeta().twitterImage ?? "")} onChange={(event) => updateMetaField("twitterImage", event.target.value)} /></label>
                      <label className="cms-check"><input type="checkbox" checked={Boolean(readMeta().noindex)} onChange={(event) => updateMetaField("noindex", event.target.checked)} /> Noindex</label>
                    </div>
                    <label>Schema JSON<textarea dir="ltr" rows={3} value={String(readMeta().schemaJson ?? "")} onChange={(event) => updateMetaField("schemaJson", event.target.value)} /></label>
                    <div className="cms-seo-preview">
                      <span>{String(readMeta().canonicalUrl || `/${selected.type}/${selected.slug || "slug"}`)}</span>
                      <strong>{String(readMeta().seoTitle || selected.titleAr || "عنوان نتيجة البحث")}</strong>
                      <p>{String(readMeta().metaDescription || selected.summaryAr || "وصف مختصر يظهر في نتائج البحث.")}</p>
                      <small>Title: {String(readMeta().seoTitle || selected.titleAr).length}/70 · Description: {String(readMeta().metaDescription || selected.summaryAr).length}/160</small>
                    </div>
                  </div>
                  {mediaFieldsFor(selected.type).map((field) => {
                    const meta = readMeta();
                    const selectedAsset = media.find((asset) => asset.id === String(meta[field.key] ?? ""));
                    const placement = String(meta[`${field.key}_placement`] ?? "inline") as ImagePlacement;
                    const aspect = String(meta[`${field.key}_aspect`] ?? "auto");
                    const alignment = String(meta[`${field.key}_alignment`] ?? "center");
                    return <div className="cms-media-picker" key={field.key} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handleMediaFiles(event.dataTransfer.files, field); }}>
                      <div className="panel-heading"><div><h3>{field.label}</h3><p>اختر أو ارفع صورة مباشرة دون مغادرة شاشة التحرير.</p></div>{selectedAsset && <button className="cms-row-actions" type="button" onClick={() => removeMetaField(field.key, field.altArKey, field.altEnKey, ...(field.key === "imageAssetId" ? ["image"] : []))}>إزالة الصورة</button>}</div>
                      {selectedAsset ? <div className="cms-selected-media"><img style={{ objectPosition: `${Number(meta[`${field.key}_focalX`] ?? 50)}% ${Number(meta[`${field.key}_focalY`] ?? 50)}%` }} src={selectedAsset.url} alt={String(meta[field.altArKey] || selectedAsset.altAr)} /><span>{selectedAsset.filename}<small>{selectedAsset.width ?? "?"}×{selectedAsset.height ?? "?"} · {Math.round(selectedAsset.sizeBytes / 1024)} KB</small></span><div><button className="cms-ghost-button" type="button" onClick={() => openMediaPicker(field)}>تغيير الصورة</button><button className="cms-ghost-button" type="button" onClick={() => setMessage("استخدم إعدادات موضع الصورة ونقطة التركيز أسفل المعاينة.")}>تعديل</button><a href={selectedAsset.url} target="_blank" rel="noreferrer">فتح المعاينة</a></div></div> : <button className="cms-image-dropzone" type="button" onClick={() => openMediaPicker(field)}><ImageIcon size={28} /><strong>+ اختيار أو رفع صورة</strong><span>اسحب الصورة هنا أيضاً أو الصقها من الحافظة داخل المنتقي</span></button>}
                      <button className="cms-ghost-button" type="button" onClick={() => openMediaPicker(field)}>{selectedAsset ? "تغيير الصورة" : "اختيار صورة"}</button>
                      <div className="cms-placement-controls">
                        <label>موضع الصورة<select value={placement} onChange={(event) => updateImageSetting(field, "placement", event.target.value)}>{Object.entries(imagePlacementLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                        <label>نسبة العرض<select value={aspect} onChange={(event) => updateImageSetting(field, "aspect", event.target.value)}><option value="auto">تلقائي</option><option value="1/1">مربع 1:1</option><option value="4/3">قياسي 4:3</option><option value="16/9">عريض 16:9</option><option value="21/9">سينمائي 21:9</option></select></label>
                        <label>المحاذاة<select value={alignment} onChange={(event) => updateImageSetting(field, "alignment", event.target.value)}><option value="start">بداية</option><option value="center">وسط</option><option value="end">نهاية</option></select></label>
                      </div>
                      {selectedAsset && <div className="cms-focal-controls">
                        <p>نقطة التركيز تساعد على إبقاء الوجه أو المنتج ظاهراً عند القص المتجاوب.</p>
                        <label>أفقي<input type="range" min="0" max="100" value={Number(meta[`${field.key}_focalX`] ?? 50)} onChange={(event) => updateImageSetting(field, "focalX", event.target.value)} /></label>
                        <label>عمودي<input type="range" min="0" max="100" value={Number(meta[`${field.key}_focalY`] ?? 50)} onChange={(event) => updateImageSetting(field, "focalY", event.target.value)} /></label>
                      </div>}
                      {selectedAsset && <div className="cms-form-row"><label>Alt عربي<input value={String(meta[field.altArKey] ?? "")} onChange={(event) => updateMetaField(field.altArKey, event.target.value)} /></label><label dir="ltr">English alt<input value={String(meta[field.altEnKey] ?? "")} onChange={(event) => updateMetaField(field.altEnKey, event.target.value)} /></label></div>}
                    </div>;
                  })}
                  {supportsGallery(selected.type) && (() => {
                    const galleryKey = "galleryImageAssetIds";
                    const selectedIds = galleryIds(galleryKey);
                    const selectedGalleryAssets = selectedIds.map((id) => media.find((asset) => asset.id === id)).filter((asset): asset is CmsMediaAsset => Boolean(asset));
                    return <div className="cms-media-picker cms-gallery-picker" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handleMediaFiles(event.dataTransfer.files, undefined, galleryKey); }}>
                      <div className="panel-heading">
                        <div><h3>معرض الصور</h3><p>ارفع عدة صور أو اخترها من مكتبة الوسائط، ثم رتبها أو احذف ما لا تحتاجه.</p></div>
                        <button className="cms-ghost-button" type="button" onClick={() => openGalleryPicker(galleryKey)}>إضافة صور</button>
                      </div>
                      {selectedGalleryAssets.length > 0 ? (
                        <div className="cms-gallery-list">
                          {selectedGalleryAssets.map((asset, index) => (
                            <article key={asset.id}>
                              <img src={asset.url} alt={asset.altAr || asset.filename} draggable="false" />
                              <strong>{asset.filename}</strong>
                              <div>
                                <button type="button" onClick={() => moveGalleryImage(galleryKey, asset.id, -1)} disabled={index === 0}>أعلى</button>
                                <button type="button" onClick={() => moveGalleryImage(galleryKey, asset.id, 1)} disabled={index === selectedGalleryAssets.length - 1}>أسفل</button>
                                <button type="button" onClick={() => removeGalleryImage(galleryKey, asset.id)}>إزالة</button>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <button className="cms-image-dropzone" type="button" onClick={() => openGalleryPicker(galleryKey)}><ImageIcon size={28} /><strong>+ إضافة صور للمعرض</strong><span>يدعم الاختيار المتعدد والسحب والإفلات</span></button>
                      )}
                    </div>;
                  })()}
                  {selected.type === "homepage" && <div className="cms-section-settings">
                    <div className="panel-heading"><div><h3>إعدادات قسم رؤى</h3><p>تحكم في القسم التحريري من دون تعديل الكود.</p></div></div>
                    <div className="cms-home-section-manager">
                      <h3>أقسام الصفحة الرئيسية</h3>
                      <p className="cms-form-note">اسحب الأقسام لترتيبها، أو استخدم رقم الترتيب عند الحاجة.</p>
                      {getHomeSectionSettings().map((section) => (
                        <article
                          key={section.key}
                          draggable
                          className={draggedHomeSection === section.key ? "is-dragging" : ""}
                          onDragStart={() => setDraggedHomeSection(section.key)}
                          onDragEnd={() => setDraggedHomeSection(null)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (draggedHomeSection) reorderHomeSections(draggedHomeSection, section.key);
                            setDraggedHomeSection(null);
                          }}
                        >
                          <span className="cms-drag-handle" aria-hidden="true">⋮⋮</span>
                          <label className="cms-check"><input type="checkbox" checked={section.visible} onChange={(event) => updateHomeSection(section.key, { visible: event.target.checked })} /> {section.label}</label>
                          <label>الترتيب<input type="number" min="1" max="20" value={section.order} onChange={(event) => updateHomeSection(section.key, { order: Number(event.target.value) })} /></label>
                        </article>
                      ))}
                    </div>
                    <div className="cms-section-settings related-projects-admin-panel">
                      <div className="panel-heading">
                        <div>
                          <h3>إدارة قسم المشاريع ذات الصلة</h3>
                          <p>اختر المشاريع التي تظهر في قسم «المشاريع ذات الصلة» على الصفحة الرئيسية، ورتب ظهورها. صورة/شعار ورابط كل مشروع يتم التحكم بهما من قسم «المشاريع».</p>
                        </div>
                      </div>
                      <div className="cms-form-note">
                        <strong>طريقة الاستخدام:</strong> فعّل المشاريع المطلوبة ثم استخدم أزرار «أعلى» و«أسفل» لتحديد ترتيبها. إذا لم تحدد أي مشروع سيظهر جميع المشاريع المنشورة تلقائياً.
                      </div>
                      <div className="related-projects-admin-list">
                        {(() => {
                          const allProjects = items
                            .filter((item) => item.type === "project" && item.status === "published")
                            .sort((a, b) => a.sortOrder - b.sortOrder);
                          const configured = Array.isArray(readMeta().relatedProjectSlugs)
                            ? (readMeta().relatedProjectSlugs as unknown[]).filter((value): value is string => typeof value === "string")
                            : [];
                          const activeSlugs = configured.length ? configured.filter((slug) => allProjects.some((project) => project.slug === slug)) : allProjects.map((project) => project.slug);
                          const ordered = [
                            ...activeSlugs.map((slug) => allProjects.find((project) => project.slug === slug)).filter((project): project is CmsContentItem => Boolean(project)),
                            ...allProjects.filter((project) => !activeSlugs.includes(project.slug))
                          ];
                          const moveRelatedProject = (slug: string, direction: -1 | 1) => {
                            const current = activeSlugs.slice();
                            const index = current.indexOf(slug);
                            const nextIndex = index + direction;
                            if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return;
                            [current[index], current[nextIndex]] = [current[nextIndex], current[index]];
                            updateMetaField("relatedProjectSlugs", current);
                          };
                          const toggleRelatedProject = (slug: string, checked: boolean) => {
                            const current = activeSlugs.slice();
                            const next = checked ? [...current, slug] : current.filter((value) => value !== slug);
                            updateMetaField("relatedProjectSlugs", next);
                          };
                          return ordered.length ? ordered.map((project, index) => {
                            const enabled = activeSlugs.includes(project.slug);
                            const activeIndex = activeSlugs.indexOf(project.slug);
                            const imageId = typeof project.meta?.imageAssetId === "string" ? project.meta.imageAssetId : "";
                            const asset = imageId ? media.find((item) => item.id === imageId) : null;
                            const projectUrl = typeof project.meta?.projectUrl === "string"
                              ? project.meta.projectUrl
                              : typeof project.meta?.websiteUrl === "string"
                                ? project.meta.websiteUrl
                                : typeof project.meta?.url === "string" ? project.meta.url : "";
                            return (
                              <article className={`related-project-admin-row ${enabled ? "is-enabled" : ""}`} key={project.id}>
                                <label className="cms-check related-project-admin-toggle">
                                  <input type="checkbox" checked={enabled} onChange={(event) => toggleRelatedProject(project.slug, event.target.checked)} />
                                  <span className="related-project-admin-preview">
                                    {asset ? <img src={asset.url} alt={asset.altAr || project.titleAr} /> : <span>{(project.titleAr || project.titleEn).slice(0, 2)}</span>}
                                  </span>
                                  <span className="related-project-admin-copy">
                                    <strong>{project.titleAr || project.titleEn}</strong>
                                    <small dir="ltr">{projectUrl || "لا يوجد رابط للمشروع بعد"}</small>
                                  </span>
                                </label>
                                {enabled && (
                                  <div className="related-project-admin-actions">
                                    <span>{activeIndex + 1}</span>
                                    <button type="button" disabled={activeIndex <= 0} onClick={() => moveRelatedProject(project.slug, -1)}>أعلى</button>
                                    <button type="button" disabled={activeIndex < 0 || activeIndex >= activeSlugs.length - 1} onClick={() => moveRelatedProject(project.slug, 1)}>أسفل</button>
                                  </div>
                                )}
                              </article>
                            );
                          }) : <p className="cms-form-note">لا توجد مشاريع منشورة حالياً. أضف المشاريع من قسم «المشاريع» أولاً.</p>;
                        })()}
                      </div>
                    </div>
                    <label className="cms-check"><input type="checkbox" checked={readMeta().insightsVisible !== false} onChange={(event) => updateMetaField("insightsVisible", event.target.checked)} /> إظهار قسم رؤى في الصفحة الرئيسية</label>
                    <label className="cms-check"><input type="checkbox" checked={readMeta().insightsTickerVisible !== false} onChange={(event) => updateMetaField("insightsTickerVisible", event.target.checked)} /> إظهار شريط آخر المقالات</label>
                    <div className="cms-form-row">
                      <label>عنوان رؤى بالعربية<input value={String((readMeta().insightsHeading as Record<string, unknown> | undefined)?.ar ?? "")} onChange={(event) => updateLocalizedMetaField("insightsHeading", "ar", event.target.value)} placeholder="أحدث الرؤى والمقالات" /></label>
                      <label dir="ltr">Insights heading<input value={String((readMeta().insightsHeading as Record<string, unknown> | undefined)?.en ?? "")} onChange={(event) => updateLocalizedMetaField("insightsHeading", "en", event.target.value)} placeholder="Latest Insights & Articles" /></label>
                    </div>
                    <div className="cms-form-row">
                      <label>وصف القسم بالعربية<textarea rows={2} value={String((readMeta().insightsDescription as Record<string, unknown> | undefined)?.ar ?? "")} onChange={(event) => updateLocalizedMetaField("insightsDescription", "ar", event.target.value)} placeholder="مقالات عملية في التسويق الرقمي وتطوير الأعمال..." /></label>
                      <label dir="ltr">Section description<textarea dir="ltr" rows={2} value={String((readMeta().insightsDescription as Record<string, unknown> | undefined)?.en ?? "")} onChange={(event) => updateLocalizedMetaField("insightsDescription", "en", event.target.value)} placeholder="Practical articles on digital marketing..." /></label>
                    </div>
                    <div className="cms-form-row">
                      <label>عنوان الشريط بالعربية<input value={String((readMeta().insightsTickerLabel as Record<string, unknown> | undefined)?.ar ?? "")} onChange={(event) => updateLocalizedMetaField("insightsTickerLabel", "ar", event.target.value)} placeholder="أهم المقالات" /></label>
                      <label dir="ltr">Ticker label<input value={String((readMeta().insightsTickerLabel as Record<string, unknown> | undefined)?.en ?? "")} onChange={(event) => updateLocalizedMetaField("insightsTickerLabel", "en", event.target.value)} placeholder="Important articles" /></label>
                    </div>
                    <div className="cms-form-row">
                      <label>عدد المقالات<input type="number" min="3" max="10" value={Number(readMeta().insightsArticleCount ?? 5)} onChange={(event) => updateMetaField("insightsArticleCount", Number(event.target.value))} /></label>
                      <label>عدد عناوين الشريط<input type="number" min="1" max="10" value={Number(readMeta().insightsTickerCount ?? 6)} onChange={(event) => updateMetaField("insightsTickerCount", Number(event.target.value))} /></label>
                    </div>
                    <label>سرعة حركة الشريط<select value={String(readMeta().insightsTickerSpeed ?? "slow")} onChange={(event) => updateMetaField("insightsTickerSpeed", event.target.value)}>
                      <option value="slow">هادئة</option>
                      <option value="medium">متوسطة</option>
                    </select></label>
                    <label className="cms-check"><input type="checkbox" checked={readMeta().insightsShowAllButton !== false} onChange={(event) => updateMetaField("insightsShowAllButton", event.target.checked)} /> إظهار زر عرض جميع المقالات</label>
                    <label>المقال المميز<select value={String(readMeta().insightsFeaturedSlug ?? "")} onChange={(event) => updateMetaField("insightsFeaturedSlug", event.target.value)}><option value="">الأحدث تلقائياً</option>{items.filter((item) => item.type === "article" && item.status === "published").map((item) => <option value={item.slug} key={item.id}>{item.titleAr}</option>)}</select></label>
                  </div>}
                  {selected.type === "footer" && <div className="cms-section-settings cms-footer-editor">
                    <div className="panel-heading"><div><h3>محرر الفوتر العام</h3><p>حقول مرئية آمنة لتعديل الفوتر من دون HTML أو CSS.</p></div></div>
                    <div className="cms-form-row">
                      <label>نمط الفوتر<select value={String(readMeta().visualPreset ?? "luxury-dark")} onChange={(event) => updateMetaField("visualPreset", event.target.value)}>
                        {footerPresets.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
                      </select></label>
                      <label className="cms-check"><input type="checkbox" checked={readMeta().patternVisible !== false} onChange={(event) => updateMetaField("patternVisible", event.target.checked)} /> إظهار الزخرفة الهندسية</label>
                    </div>
                    <div className="cms-form-row">
                      <label>وصف العلامة بالعربية<textarea rows={3} value={String((readMeta().brandDescription as Record<string, unknown> | undefined)?.ar ?? "")} onChange={(event) => updateLocalizedMetaField("brandDescription", "ar", event.target.value)} placeholder="أساعد الأفراد والمشاريع..." /></label>
                      <label dir="ltr">Brand description<textarea dir="ltr" rows={3} value={String((readMeta().brandDescription as Record<string, unknown> | undefined)?.en ?? "")} onChange={(event) => updateLocalizedMetaField("brandDescription", "en", event.target.value)} placeholder="I help people and businesses..." /></label>
                    </div>
                    <label>رابط الخصوصية<input dir="ltr" value={String(readMeta().privacyHref ?? "/privacy-policy")} onChange={(event) => updateMetaField("privacyHref", event.target.value)} /></label>
                    <div className="cms-footer-fieldset">
                      <h3>روابط التنقل</h3>
                      <div className="cms-check-grid">
                        {footerNavLinks.map((link) => {
                          const visibility = readMeta().navVisibility as Record<string, unknown> | undefined;
                          return <label className="cms-check" key={link.href}><input type="checkbox" checked={visibility?.[link.href] !== false} onChange={(event) => updateMetaMapField("navVisibility", link.href, event.target.checked)} /> {link.labelAr}</label>;
                        })}
                      </div>
                    </div>
                    <div className="cms-footer-fieldset">
                      <h3>روابط الخدمات</h3>
                      <p className="cms-form-note">اختر حتى خمس خدمات. إذا لم تختر شيئاً سيعرض الموقع أول الخدمات المنشورة تلقائياً.</p>
                      <div className="cms-check-grid">
                        {items.filter((item) => item.type === "service").slice(0, 12).map((service) => {
                          const selectedSlugs = Array.isArray(readMeta().serviceSlugs) ? readMeta().serviceSlugs as string[] : [];
                          return <label className="cms-check" key={service.id}><input type="checkbox" checked={selectedSlugs.includes(service.slug)} onChange={(event) => {
                            const next = event.target.checked ? [...selectedSlugs, service.slug].slice(0, 5) : selectedSlugs.filter((slug) => slug !== service.slug);
                            updateMetaField("serviceSlugs", next);
                          }} /> {service.titleAr}</label>;
                        })}
                      </div>
                    </div>
                    <div className="cms-form-row">
                      <label>Phone display<input dir="ltr" value={String(readMeta().phoneDisplay ?? "+90 541 392 94 36")} onChange={(event) => updateMetaField("phoneDisplay", event.target.value)} /></label>
                      <label>Phone href<input dir="ltr" value={String(readMeta().phoneHref ?? "tel:+905413929436")} onChange={(event) => updateMetaField("phoneHref", event.target.value)} /></label>
                    </div>
                    <label>Email<input dir="ltr" value={String(readMeta().email ?? "tr@abdulazizalsari.net")} onChange={(event) => updateMetaField("email", event.target.value)} /></label>
                    <div className="cms-form-row">
                      <label>الموقع بالعربية<input value={String((readMeta().location as Record<string, unknown> | undefined)?.ar ?? "قونية، تركيا")} onChange={(event) => updateLocalizedMetaField("location", "ar", event.target.value)} /></label>
                      <label dir="ltr">Location<input dir="ltr" value={String((readMeta().location as Record<string, unknown> | undefined)?.en ?? "Konya, Turkey")} onChange={(event) => updateLocalizedMetaField("location", "en", event.target.value)} /></label>
                    </div>
                    <div className="cms-footer-fieldset">
                      <h3>روابط التواصل</h3>
                      <div className="cms-social-editor">
                        {footerSocials.map((social) => {
                          const visibility = readMeta().socialVisibility as Record<string, unknown> | undefined;
                          return <div key={social.key}>
                            <label className="cms-check"><input type="checkbox" checked={visibility?.[social.key] !== false} onChange={(event) => updateMetaMapField("socialVisibility", social.key, event.target.checked)} /> {social.label}</label>
                            <input dir="ltr" value={String(readMeta()[`${social.key}Href`] ?? social.href)} onChange={(event) => updateMetaField(`${social.key}Href`, event.target.value)} />
                          </div>;
                        })}
                      </div>
                    </div>
                    <p className="cms-form-note" dir="ltr">Footer copyright is fixed: © 2026 AbdulAziz Alsari · All rights reserved.</p>
                    <div className={`cms-footer-preview footer-preset-${String(readMeta().visualPreset ?? "luxury-dark")}`}>
                      <div><strong>معاينة الفوتر</strong><span>{String((readMeta().brandDescription as Record<string, unknown> | undefined)?.ar ?? "وصف العلامة يظهر هنا")}</span></div>
                    </div>
                  </div>}
                  {selected.type === "article" && <div className="cms-section-settings">
                    <div className="panel-heading"><div><h3>إعدادات المقال</h3><p>الظهور، الكاتب، الوسوم، المراجع، وجدولة النشر.</p></div></div>
                    <div className="cms-check-grid">
                      <label className="cms-check"><input type="checkbox" checked={Boolean(readMeta().isImportant)} onChange={(event) => updateMetaField("isImportant", event.target.checked)} /> مقال مهم</label>
                      <label className="cms-check"><input type="checkbox" checked={Boolean(readMeta().isFeatured)} onChange={(event) => updateMetaField("isFeatured", event.target.checked)} /> مقال مميز</label>
                    </div>
                    <div className="cms-form-row">
                      <label>الأولوية التحريرية<select value={String(readMeta().editorialPriority ?? "normal")} onChange={(event) => updateMetaField("editorialPriority", event.target.value)}>
                        <option value="normal">عادي</option>
                        <option value="high">مرتفع</option>
                        <option value="primary">رئيسي</option>
                      </select></label>
                      <label>تاريخ النشر<input type="date" value={String(readMeta().date ?? "")} onChange={(event) => updateMetaField("date", event.target.value)} /></label>
                    </div>
                    <label>موعد النشر المجدول<input type="datetime-local" value={String(readMeta().publishAt ?? "")} onChange={(event) => updateMetaField("publishAt", event.target.value)} /><small>يُستخدم عندما تكون الحالة «مجدول».</small></label>
                    <div className="cms-form-row">
                      <label>اسم الكاتب<input value={String(readMeta().authorName ?? user.displayName ?? user.email)} onChange={(event) => updateMetaField("authorName", event.target.value)} /></label>
                      <label>صورة الكاتب URL<input dir="ltr" value={String(readMeta().authorImage ?? "")} onChange={(event) => updateMetaField("authorImage", event.target.value)} /></label>
                    </div>
                    <div className="cms-form-row">
                      <label>نبذة الكاتب بالعربية<textarea rows={3} value={String(readMeta().authorBioAr ?? "")} onChange={(event) => updateMetaField("authorBioAr", event.target.value)} /></label>
                      <label dir="ltr">Author bio<textarea dir="ltr" rows={3} value={String(readMeta().authorBioEn ?? "")} onChange={(event) => updateMetaField("authorBioEn", event.target.value)} /></label>
                    </div>
                    <label>الوسوم<input value={Array.isArray(readMeta().tags) ? (readMeta().tags as string[]).join(", ") : ""} onChange={(event) => updateMetaField("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="تسويق رقمي، تجارة دولية، مواقع" /></label>
                    <label>المراجع والمصادر<textarea rows={4} value={Array.isArray(readMeta().references) ? (readMeta().references as string[]).join("\n") : ""} onChange={(event) => updateMetaField("references", event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))} placeholder="مرجع أو رابط في كل سطر" /></label>
                    <div className="cms-form-row">
                      <label>CTA عنوان عربي<input value={String(readMeta().ctaTitleAr ?? "")} onChange={(event) => updateMetaField("ctaTitleAr", event.target.value)} /></label>
                      <label dir="ltr">CTA English<input dir="ltr" value={String(readMeta().ctaTitleEn ?? "")} onChange={(event) => updateMetaField("ctaTitleEn", event.target.value)} /></label>
                    </div>
                    <label>CTA URL<input dir="ltr" value={String(readMeta().ctaUrl ?? "")} onChange={(event) => updateMetaField("ctaUrl", event.target.value)} placeholder="/consultation" /></label>
                  </div>}
                  {(selected.type === "article" || active === "article") && <div className="cms-section-settings cms-import-export">
                    <div className="panel-heading"><div><h3>استيراد مقالات WordPress</h3><p>ارفع ملف التصدير الرسمي من WordPress بصيغة XML/WXR مباشرة، أو استخدم XLSX/CSV. ستظهر معاينة قبل الحفظ مع كشف المقالات المكررة.</p></div></div>
                    <div className="cms-form-row">
                      <label>ملف المقالات<input type="file" accept=".xml,.wxr,.xlsx,.xls,.csv,application/xml,text/xml" onChange={(event) => { setArticleImportFile(event.target.files?.[0] ?? null); setArticleImportPreview([]); setArticleImportSummary(null); }} /></label>
                      <label>استراتيجية التكرار<select value={articleImportStrategy} onChange={(event) => setArticleImportStrategy(event.target.value as "skip" | "update" | "copy")}>
                        <option value="skip">Skip Existing - الأكثر أماناً</option>
                        <option value="update">Update Existing</option>
                        <option value="copy">Create New Copy</option>
                      </select></label>
                    </div>
                    <label className="cms-check"><input type="checkbox" checked={articleImportImages} onChange={(event) => setArticleImportImages(event.target.checked)} /> نسخ صور WordPress إلى مكتبة وسائط الموقع وربطها بالمقالات</label>
                    <div className="cms-form-actions">
                      <button className="cms-ghost-button" type="button" disabled={busy} onClick={() => runArticleImport("preview")}>معاينة الملف</button>
                      <button className="dashboard-primary" type="button" disabled={busy || !articleImportPreview.length} onClick={() => runArticleImport("import")}>استيراد المقالات</button>
                      <button className="cms-ghost-button" type="button" onClick={() => { window.location.href = "/api/admin/articles/import-export?mode=template"; }}>تحميل قالب Excel</button>
                      <button className="cms-ghost-button" type="button" onClick={() => { window.location.href = "/api/admin/articles/import-export?format=cms"; }}>تصدير CMS Excel</button>
                      <button className="cms-ghost-button" type="button" onClick={() => { window.location.href = "/api/admin/articles/import-export?format=wordpress"; }}>تصدير WordPress Excel</button>
                    </div>
                    {articleImportSummary && <div className="cms-import-summary">
                      <span>Rows: {articleImportSummary.rows}</span>
                      <span>Valid: {articleImportSummary.valid}</span>
                      <span>Invalid: {articleImportSummary.invalid}</span>
                      <span>New: {articleImportSummary.new}</span>
                      <span>Existing: {articleImportSummary.existing}</span>
                      <span>Warnings: {articleImportSummary.warnings}</span>
                      <span>Images: {articleImportSummary.images ?? 0}</span>
                    </div>}
                    {articleImportPreview.length > 0 && <div className="table-wrap cms-table-wrap">
                      <table><thead><tr><th>#</th><th>العنوان</th><th>الرابط</th><th>التصنيف</th><th>الكاتب</th><th>الحالة</th><th>مكرر؟</th><th>ملاحظات</th></tr></thead><tbody>
                        {articleImportPreview.map((row) => <tr key={`${row.row}-${row.slug}`}><td>{row.row}</td><td>{row.title}</td><td dir="ltr">{row.slug}</td><td>{row.category || "-"}</td><td>{row.author || "-"}</td><td>{row.status}</td><td>{row.duplicate ? "نعم" : "لا"}</td><td>{row.warnings.join(", ") || "-"}</td></tr>)}
                      </tbody></table>
                    </div>}
                    <p className="cms-form-note">ملف WordPress المطلوب: Tools → Export → All content. يدعم WXR/XML الرسمي ويستورد العنوان، المحتوى، الملخص، الحالة، التاريخ، التصنيف، الوسوم، الكاتب، الصورة البارزة إن كانت موجودة في ملف التصدير، وحقول SEO الشائعة من Yoast وRank Math. عند تفعيل خيار الصور، يقوم النظام بتنزيل الصور من موقع WordPress القديم وحفظها داخل مكتبة وسائط الموقع وربط الصورة البارزة وصور المحتوى بالمقال. إذا كان المصدر القديم غير متاح سيستمر استيراد المقال ويعرض عدد الصور التي تعذر نسخها.</p>
                  </div>}
                  {selected.type === "service" && <div className="cms-section-settings">
                    <div className="panel-heading"><div><h3>حقول الخدمة</h3><p>حقول خاصة بالخدمات فقط: الأيقونة، المزايا، CTA، وترتيب الظهور.</p></div></div>
                    <div className="cms-form-row">
                      <label>الأيقونة<input value={String(readMeta().icon ?? "")} onChange={(event) => updateMetaField("icon", event.target.value)} placeholder="Search / Code2 / Palette" /></label>
                      <label>CTA URL<input dir="ltr" value={String(readMeta().ctaUrl ?? "")} onChange={(event) => updateMetaField("ctaUrl", event.target.value)} placeholder="/consultation" /></label>
                    </div>
                    <label>المزايا<textarea rows={3} value={Array.isArray(readMeta().features) ? (readMeta().features as string[]).join("\n") : ""} onChange={(event) => updateMetaField("features", event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))} placeholder="ميزة في كل سطر" /></label>
                  </div>}
                  {selected.type === "course" && <div className="cms-section-settings">
                    <div className="panel-heading"><div><h3>حقول الدورة</h3><p>إدارة مستقلة للدورات الحالية، ومنها دورة الوردبريس، بدون خلطها مع المشاريع.</p></div></div>
                    <div className="cms-form-row">
                      <label>المدرب<input value={String(readMeta().instructor ?? "AbdulAziz Alsari")} onChange={(event) => updateMetaField("instructor", event.target.value)} /></label>
                      <label>المستوى<input value={String(readMeta().level ?? "")} onChange={(event) => updateMetaField("level", event.target.value)} placeholder="Beginner / Intermediate" /></label>
                    </div>
                    <div className="cms-form-row">
                      <label>المدة<input value={String(readMeta().duration ?? "")} onChange={(event) => updateMetaField("duration", event.target.value)} /></label>
                      <label>عدد الدروس<input type="number" value={Number(readMeta().lessonsCount ?? 0)} onChange={(event) => updateMetaField("lessonsCount", Number(event.target.value))} /></label>
                    </div>
                    <div className="cms-form-row">
                      <label>نوع الدورة<input value={String(readMeta().courseType ?? "training")} onChange={(event) => updateMetaField("courseType", event.target.value)} /></label>
                      <label>رابط الدورة<input dir="ltr" value={String(readMeta().courseUrl ?? "")} onChange={(event) => updateMetaField("courseUrl", event.target.value)} /></label>
                    </div>
                    <label className="cms-check"><input type="checkbox" checked={Boolean(readMeta().featured)} onChange={(event) => updateMetaField("featured", event.target.checked)} /> دورة مميزة</label>
                    <label>ماذا ستتعلم؟<textarea rows={4} value={Array.isArray(readMeta().learningOutcomes) ? (readMeta().learningOutcomes as string[]).join("\n") : ""} onChange={(event) => updateMetaField("learningOutcomes", event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))} placeholder="نقطة في كل سطر" /></label>
                    <label>المتطلبات<textarea rows={3} value={Array.isArray(readMeta().requirements) ? (readMeta().requirements as string[]).join("\n") : ""} onChange={(event) => updateMetaField("requirements", event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))} placeholder="متطلب في كل سطر" /></label>
                    <label>محتوى الدورة / Curriculum<textarea rows={5} value={Array.isArray(readMeta().curriculum) ? (readMeta().curriculum as string[]).join("\n") : ""} onChange={(event) => updateMetaField("curriculum", event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))} placeholder="وحدة أو درس في كل سطر" /></label>
                  </div>}
                  {selected.type === "project" && <div className="cms-section-settings">
                    <div className="panel-heading"><div><h3>حقول المشروع</h3><p>تفاصيل Portfolio فقط: العميل، التقنيات، النتائج، وروابط المشروع.</p></div></div>
                    <div className="cms-form-row">
                      <label>العميل<input value={String(readMeta().client ?? "")} onChange={(event) => updateMetaField("client", event.target.value)} /></label>
                      <label>السنة<input value={String(readMeta().year ?? "")} onChange={(event) => updateMetaField("year", event.target.value)} /></label>
                    </div>
                    <label>رابط المشروع<input dir="ltr" value={String(readMeta().projectUrl ?? "")} onChange={(event) => updateMetaField("projectUrl", event.target.value)} /></label>
                    <label>التقنيات<textarea rows={3} value={Array.isArray(readMeta().technologies) ? (readMeta().technologies as string[]).join("\n") : ""} onChange={(event) => updateMetaField("technologies", event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))} /></label>
                    <label>النتائج<textarea rows={3} value={Array.isArray(readMeta().results) ? (readMeta().results as string[]).join("\n") : ""} onChange={(event) => updateMetaField("results", event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))} /></label>
                  </div>}
                  {selected.type === "experience" && <div className="cms-section-settings">
                    <div className="panel-heading"><div><h3>حقول الخبرة</h3><p>خبرة مستقلة عن المهارات، مع تاريخ ودور ونقاط إنجاز.</p></div></div>
                    <div className="cms-form-row">
                      <label>الشركة / المشروع<input value={String(readMeta().company ?? "")} onChange={(event) => updateMetaField("company", event.target.value)} /></label>
                      <label>الدور<input value={String(readMeta().role ?? "")} onChange={(event) => updateMetaField("role", event.target.value)} /></label>
                    </div>
                    <div className="cms-form-row">
                      <label>تاريخ البداية<input type="date" value={String(readMeta().startDate ?? "")} onChange={(event) => updateMetaField("startDate", event.target.value)} /></label>
                      <label>تاريخ النهاية<input type="date" value={String(readMeta().endDate ?? "")} onChange={(event) => updateMetaField("endDate", event.target.value)} /></label>
                    </div>
                    <label>أبرز النقاط<textarea rows={3} value={Array.isArray(readMeta().highlights) ? (readMeta().highlights as string[]).join("\n") : ""} onChange={(event) => updateMetaField("highlights", event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))} /></label>
                  </div>}
                  {selected.type === "skill" && <div className="cms-section-settings">
                    <div className="panel-heading"><div><h3>حقول المهارة</h3><p>اسم المهارة، التصنيف، المستوى، الأيقونة، وإظهارها في الواجهة.</p></div></div>
                    <div className="cms-form-row">
                      <label>المستوى %<input type="number" min="0" max="100" value={Number(readMeta().level ?? 75)} onChange={(event) => updateMetaField("level", Number(event.target.value))} /></label>
                      <label>الأيقونة<input value={String(readMeta().icon ?? "")} onChange={(event) => updateMetaField("icon", event.target.value)} /></label>
                    </div>
                    <label className="cms-check"><input type="checkbox" checked={readMeta().visible !== false} onChange={(event) => updateMetaField("visible", event.target.checked)} /> إظهار المهارة</label>
                  </div>}
                  {selected.type === "integration" && <div className="cms-section-settings cms-integrations-editor">
                    <div className="panel-heading"><div><h3>تكاملات Google وBing</h3><p>يتم تحميل الأكواد فقط عند تفعيلها، ولا يتم ادعاء تحقق Google أو Bing دون API رسمي.</p></div></div>
                    <label className="cms-check"><input type="checkbox" checked={Boolean(readMeta().googleSearchConsoleEnabled)} onChange={(event) => updateMetaField("googleSearchConsoleEnabled", event.target.checked)} /> تفعيل Google Search Console Meta</label>
                    <label>Google verification content<input dir="ltr" value={String(readMeta().googleSiteVerification ?? "")} onChange={(event) => updateMetaField("googleSiteVerification", event.target.value)} placeholder="google-site-verification=xxxx أو xxxx" /></label>
                    <label className="cms-check"><input type="checkbox" checked={Boolean(readMeta().ga4Enabled)} onChange={(event) => updateMetaField("ga4Enabled", event.target.checked)} /> تفعيل Google Analytics 4</label>
                    <label>GA4 Measurement ID<input dir="ltr" value={String(readMeta().ga4MeasurementId ?? "")} onChange={(event) => updateMetaField("ga4MeasurementId", event.target.value.toUpperCase())} placeholder="G-XXXXXXXXXX" /></label>
                    <label className="cms-check"><input type="checkbox" checked={Boolean(readMeta().gtmEnabled)} onChange={(event) => updateMetaField("gtmEnabled", event.target.checked)} /> تفعيل Google Tag Manager</label>
                    <label>GTM Container ID<input dir="ltr" value={String(readMeta().gtmContainerId ?? "")} onChange={(event) => updateMetaField("gtmContainerId", event.target.value.toUpperCase())} placeholder="GTM-XXXXXXX" /></label>
                    <label className="cms-check"><input type="checkbox" checked={Boolean(readMeta().adsenseEnabled)} onChange={(event) => updateMetaField("adsenseEnabled", event.target.checked)} /> تفعيل Google AdSense</label>
                    <label>AdSense Client ID<input dir="ltr" value={String(readMeta().adsenseClientId ?? "")} onChange={(event) => updateMetaField("adsenseClientId", event.target.value)} placeholder="ca-pub-XXXXXXXXXXXXXXXX" /></label>
                    <label className="cms-check"><input type="checkbox" checked={Boolean(readMeta().bingEnabled)} onChange={(event) => updateMetaField("bingEnabled", event.target.checked)} /> تفعيل Bing Webmaster Verification</label>
                    <label>Bing verification<input dir="ltr" value={String(readMeta().bingVerification ?? "")} onChange={(event) => updateMetaField("bingVerification", event.target.value)} /></label>
                    <div className="cms-integration-status">
                      <span>{readMeta().googleSiteVerification ? "Search Console: Configured" : "Search Console: Not configured"}</span>
                      <span>{/^G-[A-Z0-9]+$/.test(String(readMeta().ga4MeasurementId ?? "")) ? "GA4: Configured" : "GA4: Not configured"}</span>
                      <span>{/^GTM-[A-Z0-9]+$/.test(String(readMeta().gtmContainerId ?? "")) ? "GTM: Configured" : "GTM: Not configured"}</span>
                      <span>{/^ca-pub-\d+$/.test(String(readMeta().adsenseClientId ?? "")) ? "AdSense: Configured" : "AdSense: Not configured"}</span>
                      <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Google Search Console</a>
                    </div>
                  </div>}
                  <label>بيانات إضافية متقدمة (اختياري)<textarea dir="ltr" rows={5} value={metaText} onChange={(event) => setMetaText(event.target.value)} /></label>
                  {selected.id && <div className="cms-revisions">
                    <div className="panel-heading">
                      <div><h3><History size={16} /> النسخ السابقة</h3><p>يتم حفظ نسخة قبل كل تعديل أو حذف، ويمكن استرجاع أي نسخة.</p></div>
                      <button className="cms-ghost-button" type="button" onClick={() => loadRevisions(selected.id)}>تحديث</button>
                    </div>
                    {revisions.length ? revisions.slice(0, 8).map((revision) => (
                      <article key={revision.id}>
                        <span>{new Date(revision.createdAt).toLocaleString("ar")}</span>
                        <strong>{revision.snapshot.titleAr || revision.snapshot.slug}</strong>
                        <button type="button" onClick={() => restoreRevision(revision.id)}>استرجاع</button>
                      </article>
                    )) : <p className="cms-form-note">لا توجد نسخ سابقة لهذا العنصر بعد.</p>}
                  </div>}
                  <div className="cms-form-actions">
                    <button className="btn btn-primary" type="submit" disabled={busy}><Save size={18} /> {busy ? "جار الحفظ..." : "حفظ"}</button>
                    {selected.id && selected.type === "article" && user.role === "writer" && user.permissions.includes("articles_submit") && <button className="cms-ghost-button" type="button" disabled={busy} onClick={sendArticleForReview}>إرسال للنشر</button>}
                    {selected.id && selected.type === "article" && user.role === "reviewer" && user.permissions.includes("articles_publish") && <button className="btn btn-primary" type="button" disabled={busy} onClick={publishArticle}>نشر المقال</button>}
                    {selected.id && selected.type === "article" && <a className="cms-ghost-button" href={`/dashboard/preview/article/${selected.id}`} target="_blank" rel="noreferrer">معاينة المقال</a>}
                    {selected.id && <button className="cms-danger-button" type="button" onClick={() => deleteItem(selected.id)}><Trash2 size={17} /> حذف</button>}
                  </div>
                </form>
              </section>
            </div>
          )}

          {active === "related-projects" && (() => {
            const homepage = items.find((item) => item.type === "homepage");
            const allProjects = items.filter((item) => item.type === "project" && item.status === "published").sort((a, b) => a.sortOrder - b.sortOrder);
            const configured = Array.isArray(homepage?.meta?.relatedProjectSlugs)
              ? (homepage?.meta?.relatedProjectSlugs as unknown[]).filter((value): value is string => typeof value === "string")
              : [];
            const activeSlugs = configured.length ? configured.filter((slug) => allProjects.some((project) => project.slug === slug)) : allProjects.map((project) => project.slug);
            const saveRelated = (slugs: string[]) => {
              if (!homepage) return;
              const next = { ...homepage, meta: { ...(homepage.meta ?? {}), relatedProjectSlugs: slugs } };
              setItems((current) => current.map((item) => item.id === homepage.id ? next : item));
              setSelected(next);
              setMetaText(formatMeta(next.meta));
            };
            const move = (slug: string, direction: -1 | 1) => {
              const next = activeSlugs.slice();
              const index = next.indexOf(slug);
              const target = index + direction;
              if (index < 0 || target < 0 || target >= next.length) return;
              [next[index], next[target]] = [next[target], next[index]];
              saveRelated(next);
            };
            const toggle = (slug: string, enabled: boolean) => {
              saveRelated(enabled ? [...activeSlugs, slug] : activeSlugs.filter((value) => value !== slug));
            };
            return (
              <section className="dashboard-panel cms-panel">
                <div className="panel-heading">
                  <div>
                    <h2>المشاريع ذات الصلة</h2>
                    <p>تحكم مستقل في المشاريع التي تظهر على الصفحة الرئيسية، ترتيبها، وإظهار/إخفاء القسم.</p>
                  </div>
                  <button className="btn btn-primary" type="button" disabled={!homepage || busy} onClick={() => { if (homepage) { setSelected(homepage); setMetaText(formatMeta(homepage.meta)); setActive("homepage"); } }}>فتح إعدادات الصفحة الرئيسية</button>
                </div>
                {!homepage ? (
                  <p className="cms-form-note">لم يتم العثور على إعداد الصفحة الرئيسية في CMS.</p>
                ) : (
                  <>
                    <div className="related-projects-admin-summary">
                      <label className="cms-check">
                        <input
                          type="checkbox"
                          checked={getHomeSectionSettings().find((section) => section.key === "relatedProjects")?.visible !== false}
                          onChange={(event) => {
                            const currentSections = getHomeSectionSettings();
                            const nextSections = currentSections.map((section) => section.key === "relatedProjects" ? { ...section, visible: event.target.checked } : section);
                            const homepageNow = items.find((item) => item.type === "homepage");
                            if (!homepageNow) return;
                            const next = { ...homepageNow, meta: { ...(homepageNow.meta ?? {}), homeSections: nextSections.map((section, index) => ({ key: section.key, visible: section.visible, order: section.order ?? index + 1 })) } };
                            setItems((current) => current.map((item) => item.id === next.id ? next : item));
                            setSelected(next);
                            setMetaText(formatMeta(next.meta));
                          }}
                        /> إظهار قسم المشاريع ذات الصلة
                      </label>
                      <span>·</span>
                      <strong>المختار:</strong> {activeSlugs.length}
                      <span>·</span>
                      <strong>إجمالي المشاريع المنشورة:</strong> {allProjects.length}
                    </div>
                    <div className="related-projects-admin-list">
                      {allProjects.map((project) => {
                        const enabled = activeSlugs.includes(project.slug);
                        const activeIndex = activeSlugs.indexOf(project.slug);
                        const imageId = typeof project.meta?.imageAssetId === "string" ? project.meta.imageAssetId : "";
                        const asset = imageId ? media.find((item) => item.id === imageId) : null;
                        const projectUrl = typeof project.meta?.projectUrl === "string" ? project.meta.projectUrl : typeof project.meta?.websiteUrl === "string" ? project.meta.websiteUrl : typeof project.meta?.url === "string" ? project.meta.url : "";
                        return (
                          <article className={`related-project-admin-row ${enabled ? "is-enabled" : ""}`} key={project.id}>
                            <label className="cms-check related-project-admin-toggle">
                              <input type="checkbox" checked={enabled} onChange={(event) => toggle(project.slug, event.target.checked)} />
                              <span className="related-project-admin-preview">{asset ? <img src={asset.url} alt={asset.altAr || project.titleAr} /> : <span>{(project.titleAr || project.titleEn).slice(0, 2)}</span>}</span>
                              <span className="related-project-admin-copy"><strong>{project.titleAr || project.titleEn}</strong><small dir="ltr">{projectUrl || "لا يوجد رابط للمشروع بعد"}</small></span>
                            </label>
                            {enabled && <div className="related-project-admin-actions"><span>{activeIndex + 1}</span><button type="button" disabled={activeIndex <= 0} onClick={() => move(project.slug, -1)}>أعلى</button><button type="button" disabled={activeIndex >= activeSlugs.length - 1} onClick={() => move(project.slug, 1)}>أسفل</button></div>}
                          </article>
                        );
                      })}
                    </div>
                    <div className="cms-form-actions">
                      <button className="btn btn-primary" type="button" disabled={busy} onClick={async () => {
                        const homepageNow = items.find((item) => item.type === "homepage");
                        if (!homepageNow) return;
                        setBusy(true);
                        setMessage("");
                        const response = await fetch("/api/admin/content", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ ...homepageNow, meta: { ...(homepageNow.meta ?? {}), relatedProjectSlugs: activeSlugs }, metaText: JSON.stringify({ ...(homepageNow.meta ?? {}), relatedProjectSlugs: activeSlugs }, null, 2) })
                        });
                        const data = await response.json().catch(() => ({}));
                        setBusy(false);
                        if (!response.ok || !data.item) {
                          setMessage(data.message ?? "تعذر حفظ إعدادات المشاريع ذات الصلة.");
                          return;
                        }
                        setItems((current) => current.map((item) => item.id === data.item.id ? data.item : item));
                        setSelected(data.item);
                        setMetaText(formatMeta(data.item.meta));
                        setMessage("تم حفظ إعدادات المشاريع ذات الصلة بنجاح.");
                      }}>حفظ التغييرات</button>
                    </div>
                  </>
                )}
              </section>
            );
          })()}
          {active === "page-manager" && <section className="dashboard-panel cms-panel"><div className="panel-heading"><div><h2>إدارة الصفحات</h2><p>إنشاء الصفحات وإدارتها وفتح محرر السحب والإفلات من داخل لوحة التحكم.</p></div></div><PageManagerPanel /></section>}
          {active === "integration" && <IntegrationSettings initialMeta={integrationItem?.meta ?? {}} />}

          {active === "redirects" && (
            <section className="dashboard-panel cms-panel">
              <div className="panel-heading"><div><h2>Redirect Manager</h2><p>إدارة 301 و302 و410، ويتم إنشاء 301 تلقائياً عند تغيير slug للمقالات والخدمات والدورات.</p></div></div>
              <form className="cms-form cms-redirect-form" onSubmit={saveRedirectRule}>
                <div className="cms-form-row">
                  <label>Old URL<input dir="ltr" required value={redirectDraft.oldUrl ?? ""} onChange={(event) => setRedirectDraft({ ...redirectDraft, oldUrl: event.target.value })} placeholder="/old-page" /></label>
                  <label>New URL<input dir="ltr" value={redirectDraft.newUrl ?? ""} onChange={(event) => setRedirectDraft({ ...redirectDraft, newUrl: event.target.value })} placeholder="/new-page" disabled={redirectDraft.statusCode === 410} /></label>
                </div>
                <div className="cms-form-row">
                  <label>النوع<select value={redirectDraft.statusCode ?? 301} onChange={(event) => setRedirectDraft({ ...redirectDraft, statusCode: Number(event.target.value) as CmsRedirect["statusCode"] })}><option value={301}>301 دائم</option><option value={302}>302 مؤقت</option><option value={410}>410 محذوف</option></select></label>
                  <label className="cms-check"><input type="checkbox" checked={redirectDraft.active !== false} onChange={(event) => setRedirectDraft({ ...redirectDraft, active: event.target.checked })} /> نشط</label>
                </div>
                <button className="btn btn-primary" type="submit">حفظ التحويل</button>
              </form>
              <div className="table-wrap cms-table-wrap">
                <table><thead><tr><th>Old</th><th>New</th><th>Code</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>
                  {redirects.map((rule) => <tr key={rule.id}><td dir="ltr">{rule.oldUrl}</td><td dir="ltr">{rule.newUrl || "410 Gone"}</td><td>{rule.statusCode}</td><td>{rule.active ? "نشط" : "متوقف"}</td><td><button className="cms-danger-button" type="button" onClick={() => deleteRedirectRule(rule.id)}>حذف</button></td></tr>)}
                </tbody></table>
              </div>
              <div className="cms-section-settings cms-not-found-log">
                <div className="panel-heading"><div><h3>مراقبة 404</h3><p>آخر الروابط غير الموجودة التي زارها المستخدمون، لاختيار ما يحتاج تحويل.</p></div></div>
                <div className="table-wrap cms-table-wrap">
                  <table><thead><tr><th>Path</th><th>المرات</th><th>آخر ظهور</th><th>إجراء</th></tr></thead><tbody>
                    {notFoundHits.map((hit) => (
                      <tr key={hit.id}>
                        <td dir="ltr">{hit.path}</td>
                        <td>{hit.count}</td>
                        <td>{new Date(hit.lastSeenAt).toLocaleString("ar")}</td>
                        <td><button className="cms-ghost-button" type="button" onClick={() => setRedirectDraft({ oldUrl: hit.path, newUrl: "/", statusCode: 301, active: true })}>إنشاء Redirect</button></td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
                {!notFoundHits.length && <p className="cms-form-note">لا توجد زيارات 404 مسجلة بعد.</p>}
              </div>
            </section>
          )}

          {active === "trash" && (
            <section className="dashboard-panel cms-panel">
              <div className="panel-heading"><div><h2>الأرشيف وسلة المحتوى</h2><p>الحذف هنا ناعم: يمكن استرجاع العناصر المحذوفة كمسودات.</p></div></div>
              <div className="table-wrap cms-table-wrap">
                <table><thead><tr><th>العنوان</th><th>النوع</th><th>الرابط</th><th>إجراء</th></tr></thead><tbody>
                  {deletedItems.map((item) => <tr key={item.id}><td><strong>{item.titleAr || item.titleEn}</strong></td><td>{typeLabel(item.type)}</td><td dir="ltr">{item.slug}</td><td><button className="cms-ghost-button" type="button" onClick={() => restoreItem(item.id)}>استرجاع</button></td></tr>)}
                </tbody></table>
              </div>
              {!deletedItems.length && <p className="cms-form-note">لا توجد عناصر مؤرشفة حالياً.</p>}
            </section>
          )}

          {active === "media" && (
            <section className="dashboard-panel cms-panel">
              <div className="panel-heading"><div><h2>مكتبة الوسائط</h2><p>رفع صور رسمية لاستخدامها في الصفحات والمحتوى.</p></div></div>
              <button className="dashboard-primary" type="button" onClick={() => openMediaPicker(undefined, true)}><Upload size={18} /> فتح منتقي الوسائط</button>
              <form className="cms-upload cms-upload-dropzone" onSubmit={uploadMedia} onDragOver={(event) => event.preventDefault()} onDrop={dropMedia}>
                <strong>اسحب صورة إلى هنا أو اخترها من جهازك</strong>
                <input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/avif" required />
                <label className="cms-check"><input name="watermarkEnabled" type="checkbox" value="true" /> تفعيل العلامة المائية</label>
                <input name="watermarkText" defaultValue="AbdulAziz Al-Sari | abdulazizalsari.net" aria-label="نص العلامة المائية" />
                <input name="altAr" placeholder="النص البديل بالعربية" aria-label="النص البديل بالعربية" />
                <input name="altEn" placeholder="English alt text" aria-label="English alt text" dir="ltr" />
                <button className="btn btn-primary" type="submit" disabled={busy}><Upload size={18} /> رفع الصورة</button>
              </form>
              <div className="cms-media-grid">
                {media.map((asset) => (
                  <article className="cms-media-card" key={asset.id}>
                    <img src={asset.url} alt={asset.altAr || asset.filename} draggable="false" />
                    <strong>{asset.filename}</strong>
                    <a href={asset.url} target="_blank" rel="noreferrer">معاينة الصورة</a>
                    <label>Alt عربي<input defaultValue={asset.altAr} onBlur={(event) => updateMedia(asset.id, { altAr: event.target.value })} /></label>
                    <label dir="ltr">English alt<input defaultValue={asset.altEn} onBlur={(event) => updateMedia(asset.id, { altEn: event.target.value })} /></label>
                    <label className="cms-check"><input type="checkbox" checked={asset.isProtected} onChange={(event) => updateMedia(asset.id, { isProtected: event.target.checked })} /> حماية الصورة</label>
                    <label className="cms-check"><input type="checkbox" checked={asset.watermarkEnabled} onChange={(event) => updateMedia(asset.id, { watermarkEnabled: event.target.checked })} /> العلامة المائية</label>
                    <span>{Math.round(asset.sizeBytes / 1024)} KB · {asset.width ?? "?"} × {asset.height ?? "?"}</span>
                    <button className="cms-danger-button" type="button" onClick={() => removeMedia(asset.id)}><Trash2 size={15} /> حذف الصورة</button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {active === "settings" && (
            <section className="dashboard-panel cms-panel">
              <h2>الإعدادات</h2>
              <p className="muted">قاعدة البيانات: <code>Supabase PostgreSQL</code></p>
              <p className="muted">إدارة الدخول مرتبطة بـ <code>Supabase Auth</code> وحساب المدير الموثق.</p>
              <div className="cms-settings-actions">
                <button className="btn btn-primary" type="button" onClick={() => { window.location.href = "/api/admin/backup"; }}>تنزيل نسخة احتياطية SQLite</button>
                <a className="cms-ghost-button" href="/sitemap.xml" target="_blank" rel="noreferrer">معاينة Sitemap</a>
              </div>
              <div className="cms-section-settings">
                <h3>ملاحظات النسخ الاحتياطي والصيانة</h3>
                <p className="cms-form-note">البيانات محفوظة بشكل دائم في Supabase، والصور محفوظة في Supabase Storage. استخدم زر النسخة الاحتياطية لتصدير بيانات الـCMS عند الحاجة.</p>
              </div>
            </section>
          )}
        </div>
      </section>
      {mediaPicker && (
        <div className="cms-media-modal" role="dialog" aria-modal="true" aria-label="منتقي الوسائط" onClick={() => setMediaPicker(null)}>
          <div className="cms-media-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div><h2>منتقي الوسائط</h2><p>ارفع، اسحب، الصق، استورد من رابط، أو اختر من مكتبة الوسائط.</p></div>
              <button className="cms-ghost-button" type="button" onClick={() => setMediaPicker(null)}>إغلاق</button>
            </div>

            <div className="cms-media-modal-layout">
              <section className="cms-media-upload-panel" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handleMediaFiles(event.dataTransfer.files); }}>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" multiple={mediaPicker.multi} hidden onChange={(event) => event.currentTarget.files && void handleMediaFiles(event.currentTarget.files)} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={(event) => event.currentTarget.files && void handleMediaFiles(event.currentTarget.files)} />
                <button className="cms-image-dropzone cms-modal-dropzone" type="button" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={34} />
                  <strong>رفع من الجهاز</strong>
                  <span>اسحب الصورة هنا أو اختر من جهازك</span>
                </button>
                <div className="cms-media-option-grid">
                  <button type="button" onClick={() => fileInputRef.current?.click()}>اختيار من معرض الصور</button>
                  <button type="button" onClick={() => cameraInputRef.current?.click()}>التقاط صورة بالكاميرا</button>
                  <button type="button" onClick={() => setPickerMessage("انسخ صورة ثم اضغط Ctrl + V داخل هذه النافذة.")}>لصق صورة من الحافظة</button>
                </div>
                <label className="cms-url-import">استيراد من رابط
                  <span>سيتم حفظ الصورة محلياً داخل مكتبة الوسائط، وليس ربطها خارجياً.</span>
                  <div><input dir="ltr" value={remoteImageUrl} onChange={(event) => setRemoteImageUrl(event.target.value)} placeholder="https://example.com/image.jpg" /><button type="button" onClick={importRemoteImage}>استيراد</button></div>
                </label>
                {uploadProgress !== null && <div className="cms-upload-progress"><span style={{ width: `${uploadProgress}%` }} /><strong>جاري الرفع... {uploadProgress}%</strong></div>}
                {pickerMessage && <p className="cms-picker-message">{pickerMessage}</p>}
              </section>

              <section className="cms-media-library-panel">
                <div className="cms-media-tabs"><span>مكتبة الوسائط</span><span>المستخدمة مؤخراً</span></div>
                <div className="cms-media-filter-row">
                  {mediaCategoryFilters.map((filter) => (
                    <button className={mediaCategory === filter.value ? "active" : ""} type="button" key={filter.value} onClick={() => setMediaCategory(filter.value)}>{filter.label}</button>
                  ))}
                </div>
                <input className="cms-media-search" value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} placeholder="ابحث باسم الملف أو ALT" />
                <div className="cms-picker-grid cms-modal-library">
                  {pickerMedia.map((asset) => (
                    <button className={(mediaPicker.field && String(readMeta()[mediaPicker.field.key] ?? "") === asset.id) || (mediaPicker.galleryKey && galleryIds(mediaPicker.galleryKey).includes(asset.id)) ? "selected" : ""} type="button" key={asset.id} onClick={() => chooseMedia(asset)}>
                      <img src={asset.url} alt={asset.altAr || asset.filename} draggable="false" />
                      <span>{asset.filename}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ContentTable({
  items,
  onEdit,
  onDelete,
  selectable = false,
  selectedIds = [],
  onSelectionChange
}: {
  items: CmsContentItem[];
  onEdit: (item: CmsContentItem) => void;
  onDelete: (id: string) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}) {
  const allSelected = Boolean(items.length) && items.every((item) => selectedIds.includes(item.id));
  function toggleAll(checked: boolean) {
    if (!onSelectionChange) return;
    const visibleIds = items.map((item) => item.id);
    onSelectionChange(checked ? Array.from(new Set([...selectedIds, ...visibleIds])) : selectedIds.filter((id) => !visibleIds.includes(id)));
  }
  function toggleOne(id: string, checked: boolean) {
    if (!onSelectionChange) return;
    onSelectionChange(checked ? Array.from(new Set([...selectedIds, id])) : selectedIds.filter((value) => value !== id));
  }
  const statusLabel: Record<CmsStatus, string> = {
    published: "منشور",
    draft: "مسودة",
    scheduled: "مجدول",
    archived: "مؤرشف"
  };

  return (
    <div className="table-wrap cms-table-wrap">
      <table>
        <thead>
          <tr>
            {selectable && <th><input type="checkbox" aria-label="تحديد الكل" checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} /></th>}
            <th>العنوان</th>
            <th>النوع</th>
            <th>الحالة</th>
            <th>التصنيف</th>
            <th>آخر تحديث</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {selectable && <td><input type="checkbox" aria-label={`تحديد ${item.titleAr || item.titleEn}`} checked={selectedIds.includes(item.id)} onChange={(event) => toggleOne(item.id, event.target.checked)} /></td>}
              <td><strong>{item.titleAr || item.titleEn}</strong><small>{item.slug}</small></td>
              <td>{typeLabel(item.type)}</td>
              <td><span className={`status ${item.status === "published" ? "status-active" : "status-review"}`}><i />{statusLabel[item.status]}</span></td>
              <td>{item.category || "—"}</td>
              <td>{new Date(item.updatedAt).toLocaleDateString("ar")}</td>
              <td>
                <div className="cms-row-actions">
                  <button type="button" onClick={() => onEdit(item)}>تحرير</button>
                  {item.type === "article" && item.id && <a href={`/dashboard/preview/article/${item.id}`} target="_blank" rel="noreferrer">معاينة</a>}
                  <button type="button" onClick={() => onDelete(item.id)} aria-label={`حذف ${item.titleAr || item.titleEn}`}><Trash2 size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
          {!items.length && <tr><td colSpan={selectable ? 7 : 6}>لا توجد عناصر مطابقة.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

