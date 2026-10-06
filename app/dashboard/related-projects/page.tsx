import { redirect } from "next/navigation";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import {
  listActivityLogs,
  listContentItems,
  listDeletedContentItems,
  listFormSubmissions,
  listMediaAssets,
  listNotFoundHits,
  listRedirects
} from "@/lib/cms/database";
import { Dashboard } from "../Dashboard";

export const metadata = {
  title: "المشاريع ذات الصلة | لوحة التحكم",
  description: "إدارة قسم المشاريع ذات الصلة في الصفحة الرئيسية"
};

export default async function RelatedProjectsDashboardPage() {
  const user = await getCurrentCmsUser();
  if (!user) redirect("/dashboard/login");

  const isAdmin = user.role === "admin";

  const [
    items,
    submissions,
    deletedItems,
    media,
    activity,
    redirects,
    notFoundHits
  ] = await Promise.all([
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
      initialActive="related-projects"
      lockedActive
    />
  );
}
