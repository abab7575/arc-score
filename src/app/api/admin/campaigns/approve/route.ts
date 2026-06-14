import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export async function POST() {
  const now = new Date();
  db.update(schema.agencyCampaigns).set({
    status: "approved",
    approvedAt: now.toISOString(),
    scheduledAt: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
  }).where(eq(schema.agencyCampaigns.status, "draft")).run();
  return NextResponse.redirect(publicUrl("/admin/campaigns"), 303);
}
