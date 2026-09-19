import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/cms/auth";
import { exportCmsBackup } from "@/lib/cms/database";

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  const backup = await exportCmsBackup();
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="abdulaziz-cms-${new Date().toISOString().slice(0, 10)}.json"`
    }
  });
}
