import { redirect, notFound } from "next/navigation";
import type { Data } from "@puckeditor/core";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { getPuckPage } from "@/lib/cms/puck";
import { PuckEditorClient } from "./PuckEditorClient";

export default async function PuckEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentCmsUser();
  if (!user) redirect("/admin/login");
  const { id } = await params;
  const page = await getPuckPage(id);
  if (!page) notFound();
  const data = (page.data?.content ? page.data : { content: [], root: {} }) as Data;
  return <PuckEditorClient pageId={page.id} initialData={data} />;
}
