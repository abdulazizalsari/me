import { NextResponse } from "next/server";
import { getCurrentCmsUser } from "@/lib/cms/auth";
import { deleteContentItem, getContentById, saveContentItem } from "@/lib/cms/database";
import type { CmsStatus } from "@/lib/cms/types";

type BulkAction = "publish" | "draft" | "archive" | "changeCategory";

export async function POST(request: Request) {
  const user = await getCurrentCmsUser();
  if (!user) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });

  const body = await request.json().catch(() => null) as { ids?: unknown; action?: BulkAction; category?: string } | null;
  const ids = Array.isArray(body?.ids) ? body!.ids.map(String).filter(Boolean).slice(0, 100) : [];
  const action = body?.action;
  if (!ids.length || !action) return NextResponse.json({ ok: false, message: "حدد مقالات وإجراءً صالحاً." }, { status: 400 });
  if (!["publish", "draft", "archive", "changeCategory"].includes(action)) {
    return NextResponse.json({ ok: false, message: "الإجراء غير صالح." }, { status: 400 });
  }

  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const id of ids) {
    try {
      const item = await getContentById(id);
      if (!item || item.type !== "article") {
        skipped += 1;
        continue;
      }

      if (action === "archive") {
        if (await deleteContentItem(id)) updated += 1;
        else skipped += 1;
        continue;
      }

      const status: CmsStatus = action === "publish" ? "published" : action === "draft" ? "draft" : item.status;
      const category = action === "changeCategory" ? String(body?.category ?? "").trim() : item.category;
      if (action === "changeCategory" && !category) {
        errors.push(`${item.titleAr || item.slug}: التصنيف مطلوب.`);
        continue;
      }

      await saveContentItem({
        ...item,
        status,
        category
      });
      updated += 1;
    } catch (error) {
      errors.push(`${id}: ${error instanceof Error ? error.message : "تعذر التحديث"}`);
    }
  }

  return NextResponse.json({ ok: true, updated, skipped, errors });
}
