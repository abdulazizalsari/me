import { NextResponse } from "next/server";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { listContentByType, saveContentItem } from "@/lib/cms/database";

export async function POST(request: Request) {
  const user = await getCurrentCmsUser();
  if (!user || !["admin", "editor"].includes(user.role)) {
    return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    visible?: boolean;
    titleAr?: string;
    titleEn?: string;
    autoPlay?: boolean;
    interval?: number;
    relatedProjectSlugs?: string[];
    relatedProjectConfig?: Record<string, { image?: string; href?: string; isProtected?: boolean; watermarkEnabled?: boolean }>;
  } | null;

  if (!body) return NextResponse.json({ ok: false, message: "بيانات غير صالحة." }, { status: 400 });

  try {
    const projects = await listContentByType("project");
    const allowed = new Set(projects.map(p => p.slug));
    const slugs = Array.isArray(body.relatedProjectSlugs)
      ? body.relatedProjectSlugs.filter(slug => typeof slug === "string" && allowed.has(slug))
      : [];

    const homepages = await listContentByType("homepage");
    const existing = homepages[0];
    const existingMeta = existing?.meta ?? {};
    const sections = Array.isArray(existingMeta.homeSections)
      ? existingMeta.homeSections.map(section => ({ ...(section as Record<string, unknown>) }))
      : [];

    const relatedIndex = sections.findIndex(section => section.key === "relatedProjects");
    const relatedState = { key: "relatedProjects", visible: body.visible !== false, order: 6 };
    if (relatedIndex >= 0) sections[relatedIndex] = { ...sections[relatedIndex], ...relatedState };
    else sections.push(relatedState);

    const config: Record<string, { image: string; href: string; isProtected: boolean; watermarkEnabled: boolean }> = {};
    for (const slug of slugs) {
      const value = body.relatedProjectConfig?.[slug];
      config[slug] = {
        image: typeof value?.image === "string" ? value.image.trim() : "",
        href: typeof value?.href === "string" ? value.href.trim() : "",
        isProtected: value?.isProtected !== false,
        watermarkEnabled: value?.watermarkEnabled === true
      };
    }

    const item = await saveContentItem({
      id: existing?.id,
      type: "homepage",
      slug: existing?.slug || "homepage",
      titleAr: existing?.titleAr || "الصفحة الرئيسية",
      titleEn: existing?.titleEn || "Homepage",
      summaryAr: existing?.summaryAr || "",
      summaryEn: existing?.summaryEn || "",
      bodyAr: existing?.bodyAr || "",
      bodyEn: existing?.bodyEn || "",
      category: existing?.category || "System",
      status: existing?.status || "published",
      sortOrder: existing?.sortOrder || 1,
      meta: {
        ...existingMeta,
        homeSections: sections,
        relatedProjectSlugs: slugs,
        relatedProjectsConfigured: true,
        relatedProjectConfig: config,
        relatedProjectsHeading: {
          ar: typeof body.titleAr === "string" && body.titleAr.trim() ? body.titleAr.trim() : "المشاريع ذات الصلة",
          en: typeof body.titleEn === "string" && body.titleEn.trim() ? body.titleEn.trim() : "Related Projects"
        },
        relatedProjectsAutoPlay: body.autoPlay !== false,
        relatedProjectsInterval: Math.max(3, Math.min(60, Number(body.interval) || 8))
      }
    });

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "تعذر الحفظ." }, { status: 400 });
  }
}
