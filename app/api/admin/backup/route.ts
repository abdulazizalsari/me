import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { exportAdminBackup, restoreAdminBackup } from "@/lib/cms/backup";

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const backup = await exportAdminBackup();
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="abdulaziz-cms-${new Date().toISOString().slice(0, 10)}.json"`
    }
  });
}

export async function POST(request: Request) {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const body = await request.json().catch(() => null);
  try {
    await restoreAdminBackup(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "تعذر استعادة النسخة." }, { status: 400 });
  }
}
