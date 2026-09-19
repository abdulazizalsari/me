import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { listActivityLogs, listContentItems, listDeletedContentItems, listFormSubmissions, listMediaAssets, listNotFoundHits, listRedirects } from "@/lib/cms/database";
import type { CmsContentType } from "@/lib/cms/types";
import { Dashboard } from "../Dashboard";

type DashboardTab = "overview" | CmsContentType | "media" | "redirects" | "trash" | "settings";

const routeModules: Record<string, DashboardTab> = {
  articles: "article",
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
  const user = await getCurrentAdmin();
  if (!user) redirect("/dashboard/login");

  const segments = (await params).module;
  const active = routeModules[segments[0]];
  if (!active || segments.length > 2) notFound();

  const [items, deletedItems, media, activity, redirects, notFoundHits, submissions] = await Promise.all([
    listContentItems(), listDeletedContentItems(), listMediaAssets(), listActivityLogs(), listRedirects(), listNotFoundHits(), listFormSubmissions()
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
