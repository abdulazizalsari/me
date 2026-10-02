import { NextResponse } from "next/server";
import { getCurrentAdmin, getCurrentCmsUser } from "@/lib/cms/auth";
import { deleteLanguage, listLanguages, listTranslationEntries, saveTranslation, upsertLanguage } from "@/lib/cms/translations";

export async function GET() {
  const user = await getCurrentCmsUser();
  if (!user) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const [languages, entries] = await Promise.all([listLanguages(), listTranslationEntries()]);
  return NextResponse.json({ ok: true, languages, entries });
}

export async function POST(request: Request) {
  const user = await getCurrentCmsUser();
  if (!user) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const body = await request.json().catch(() => null) as any;
  if (!body?.action) return NextResponse.json({ ok: false, message: "طلب غير صالح." }, { status: 400 });

  if (body.action === "save") {
    if (!body.key || !body.language || body.language === "ar") return NextResponse.json({ ok: false, message: "بيانات الترجمة غير صالحة." }, { status: 400 });
    await saveTranslation({ key: String(body.key), language: String(body.language), value: String(body.value ?? ""), userId: user.id });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "import") {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const languages = await listLanguages();
    const valid = new Set(languages.map((l) => l.code).filter((c) => c !== "ar"));
    let saved = 0;
    for (const row of rows.slice(0, 10000)) {
      const key = String(row?.key ?? "").trim();
      if (!key) continue;
      for (const [language, value] of Object.entries(row)) {
        if (!valid.has(language) || !String(value ?? "").trim()) continue;
        try {
          await saveTranslation({ key, language, value: String(value), userId: user.id });
          saved++;
        } catch {}
      }
    }
    return NextResponse.json({ ok: true, saved });
  }

  if (body.action === "language") {
    if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "إدارة اللغات للمدير فقط." }, { status: 403 });
    const code = String(body.code ?? "").trim();
    if (!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(code)) return NextResponse.json({ ok: false, message: "رمز اللغة غير صالح." }, { status: 400 });
    await upsertLanguage({
      code,
      nameAr: String(body.nameAr ?? code),
      nameNative: String(body.nameNative ?? code),
      direction: body.direction === "rtl" ? "rtl" : "ltr",
      enabled: body.enabled !== false,
      sortOrder: Number(body.sortOrder ?? 100)
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, message: "إجراء غير معروف." }, { status: 400 });
}

export async function DELETE(request: Request) {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "إدارة اللغات للمدير فقط." }, { status: 403 });
  const code = new URL(request.url).searchParams.get("code") || "";
  if (!code || code === "ar") return NextResponse.json({ ok: false, message: "لا يمكن حذف اللغة الأم." }, { status: 400 });
  await deleteLanguage(code);
  return NextResponse.json({ ok: true });
}
