import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { listActivityLogs, listContentItems, listDeletedContentItems, listFormSubmissions, listMediaAssets, listNotFoundHits, listRedirects } from "@/lib/cms/database";
import type { CmsContentType } from "@/lib/cms/types";
import { Dashboard } from "../Dashboard";

type DashboardTab = "overview" | CmsContentType | "related-projects" | "page-manager" | "media" | "redirects" | "trash" | "settings" | "wordpress-import";

const routeModules: Record<string, DashboardTab> = {
  articles: "article",
  "import-wordpress": "wordpress-import",
  "related-projects": "related-projects",
  "page-manager": "page-manager",
  "blog-settings": "blog-settings",
  services: "service",
  courses: "course",
  projects: "project",
  experience: "experience",
  skills: "skill",
  pages: "homepage",
  media: "media",
  seo: "seo",
  integrations: "integration",
  "site-settings": "settings",
  navigation: "navigation",
  footer: "footer",
  forms: "form",
  redirects: "redirects",
  trash: "trash",
  cv: "cv",
  education: "education",
  qualifications: "qualification",
  cta: "cta",
  contact: "contact",
  consultation: "consultation",
  whatsapp: "whatsapp",
  privacy: "privacy",
};

export const metadata: Metadata = {
  title: "لوحة التحكم",
  description: "لوحة إدارة محتوى موقع عبدالعزيز الصاري"
};

export default async function DashboardModulePage({ params }: { params: Promise<{ module: string[] }> }) {
  const user = await getCurrentCmsUser();
  if (!user) redirect("/dashboard/login");

  const segments = (await params).module;
  const active = routeModules[segments[0]];
  if (!active || segments.length > 2) notFound();

  const editorModules: DashboardTab[] = ["overview", "article", "service", "course", "form"];
  if (user.role === "editor" && !editorModules.includes(active)) redirect("/dashboard");

  const isAdmin = user.role === "admin";
  const [items, submissions, deletedItems, media, activity, redirects, notFoundHits] = await Promise.all([
    listContentItems(),
    listFormSubmissions(),
    isAdmin ? listDeletedContentItems() : Promise.resolve([]),
    isAdmin ? listMediaAssets() : Promise.resolve([]),
    isAdmin ? listActivityLogs() : Promise.resolve([]),
    isAdmin ? listRedirects() : Promise.resolve([]),
    isAdmin ? listNotFoundHits() : Promise.resolve([])
  ]);

  return (
    <Dashboard
      initialItems={items}
      initialDeletedItems={deletedItems}
      initialMedia={media}
      initialActivity={activity}
      initialRedirects={redirects}
      initialNotFoundHits={notFoundHits}
      initialSubmissions={submissions}
      user={user}
      initialActive={active}
      initialContentId={segments[1]}
      lockedActive
    />
  );
}
