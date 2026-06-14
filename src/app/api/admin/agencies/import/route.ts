import { NextResponse } from "next/server";
import { importAgencySeedCsv } from "@/lib/agency/prospects";

export const maxDuration = 300;

export async function POST(request: Request) {
  const form = await request.formData();
  const csv = String(form.get("csv") || "");
  if (!csv.trim()) return NextResponse.redirect(new URL("/admin/agencies?error=No+domains+provided", request.url), 303);
  const results = await importAgencySeedCsv(csv);
  return NextResponse.redirect(new URL(`/admin/agencies?imported=${results.length}`, request.url), 303);
}
