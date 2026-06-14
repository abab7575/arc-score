import { and, eq, lt, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { emailShell, getUnsubscribeUrl, sendAgencyEmail } from "@/lib/agency/email";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - 3 * 86400000).toISOString();
  const campaigns = db.select().from(schema.agencyCampaigns).where(and(
    eq(schema.agencyCampaigns.status, "sent"),
    lt(schema.agencyCampaigns.sentAt, cutoff),
    sql`${schema.agencyCampaigns.followupCount} < 2`,
  )).limit(20).all();
  let sent = 0;
  for (const campaign of campaigns) {
    const preview = db.select().from(schema.agencyPreviews).where(eq(schema.agencyPreviews.id, campaign.previewId)).get();
    const suppressed = db.select().from(schema.emailSuppressions).where(eq(schema.emailSuppressions.email, campaign.contactEmail.toLowerCase())).get();
    if (!preview || suppressed) continue;
    const viewed = preview.viewCount > 0;
    const subject = viewed ? `Anything unclear in your ARC portfolio preview?` : `Your ${campaign.subject.replace(/^[^:]+:\s*/, "")}`;
    const text = viewed
      ? "You opened the private portfolio preview. Arc can keep those stores monitored and generate client-ready fixes automatically. The preview remains available from the original link."
      : "A quick follow-up: the private portfolio preview remains available from the original email. It contains current evidence from public storefront scans, not a generic readiness checklist.";
    await sendAgencyEmail({ to: campaign.contactEmail, subject, text, html: emailShell(subject, `<p>${text}</p>`, getUnsubscribeUrl(campaign.contactEmail)) });
    db.update(schema.agencyCampaigns).set({
      followupCount: campaign.followupCount + 1,
      lastFollowupAt: new Date().toISOString(),
    }).where(eq(schema.agencyCampaigns.id, campaign.id)).run();
    sent++;
  }
  return NextResponse.json({ processed: campaigns.length, sent });
}
