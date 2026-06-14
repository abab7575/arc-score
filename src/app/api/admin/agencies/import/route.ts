import { NextResponse } from "next/server";
import { importAgencySeedCsv } from "@/lib/agency/prospects";
import { publicUrl } from "@/lib/public-url";

export const maxDuration = 300;

export async function POST(request: Request) {
  const form = await request.formData();
  const csv = String(form.get("csv") || "");
  if (!csv.trim()) return NextResponse.redirect(publicUrl("/admin/agencies?error=No+domains+provided"), 303);
  const results = await importAgencySeedCsv(csv);
  return NextResponse.redirect(publicUrl(`/admin/agencies?imported=${results.length}`), 303);
}
