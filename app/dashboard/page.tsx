import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { listActivityLogs, listContentItems, listDeletedContentItems, listFormSubmissions, listMediaAssets, listNotFoundHits, listRedirects } from "@/lib/cms/database";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = {
  title: "لوحة التحكم",
  description: "لوحة إدارة محتوى موقع عبدالعزيز الصاري"
};

export default async function DashboardPage() {
  const user = await getCurrentAdmin();
  if (!user) redirect("/dashboard/login");

  const [items, deletedItems, media, activity, redirects, notFoundHits, submissions] = await Promise.all([
    listContentItems(), listDeletedContentItems(), listMediaAssets(), listActivityLogs(), listRedirects(), listNotFoundHits(), listFormSubmissions()
  ]);

  return <Dashboard initialItems={items} initialDeletedItems={deletedItems} initialMedia={media} initialActivity={activity} initialRedirects={redirects} initialNotFoundHits={notFoundHits} initialSubmissions={submissions} user={user} />;
}

