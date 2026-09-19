import { notFound, permanentRedirect, redirect } from "next/navigation";
import { headers } from "next/headers";
import { findActiveRedirect, recordNotFound } from "@/lib/cms/database";

export default async function CatchAllPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const currentPath = `/${path.join("/")}`;
  const rule = await findActiveRedirect(currentPath);

  if (rule) {
    if (rule.statusCode === 301) permanentRedirect(rule.newUrl);
    if (rule.statusCode === 302) redirect(rule.newUrl);
  }

  const headerStore = await headers();
  await recordNotFound(currentPath, headerStore.get("referer") ?? "", headerStore.get("user-agent") ?? "");
  notFound();
}
