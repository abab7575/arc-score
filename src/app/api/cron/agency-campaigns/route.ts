import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { emailShell, getUnsubscribeUrl, sendAgencyEmail } from "@/lib/agency/email";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date().toISOString();
  const campaigns = db.select().from(schema.agencyCampaigns).where(and(
    eq(schema.agencyCampaigns.status, "approved"),
    sql`${schema.agencyCampaigns.scheduledAt} <= ${now}`,
  )).limit(25).all();
  let sent = 0;
  for (const campaign of campaigns) {
    const suppressed = db.select().from(schema.emailSuppressions)
      .where(eq(schema.emailSuppressions.email, campaign.contactEmail.toLowerCase())).get();
    if (suppressed || campaign.validationWarningsJson !== "[]") {
      db.update(schema.agencyCampaigns).set({ status: "suppressed" }).where(eq(schema.agencyCampaigns.id, campaign.id)).run();
      continue;
    }
    const unsubscribe = getUnsubscribeUrl(campaign.contactEmail);
    try {
      const delivered = await sendAgencyEmail({
        to: campaign.contactEmail,
        subject: campaign.subject,
        text: `${campaign.body}\n\nUnsubscribe: ${unsubscribe}`,
        html: emailShell(campaign.subject, `<div style="white-space:pre-line">${escapeHtml(campaign.body)}</div>`, unsubscribe),
      });
      db.update(schema.agencyCampaigns).set({
        status: "sent",
        sentAt: now,
        providerMessageId: delivered.id,
      }).where(eq(schema.agencyCampaigns.id, campaign.id)).run();
      sent++;
    } catch {
      // Leave approved for the next cron retry.
    }
  }
  return NextResponse.json({ processed: campaigns.length, sent });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}
