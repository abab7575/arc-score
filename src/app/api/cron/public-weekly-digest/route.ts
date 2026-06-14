import { eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { emailShell, getUnsubscribeUrl, sendAgencyEmail } from "@/lib/agency/email";
import { SITE_URL } from "@/lib/site";
import { buildWeeklyDigest, getArchiveWeeks } from "@/lib/weekly";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = getArchiveWeeks()[0];
  if (!weekStart) return NextResponse.json({ weekStart: null, pending: 0, sent: 0 });

  const digest = buildWeeklyDigest(weekStart);
  const subscribers = db.select().from(schema.emailSubscribers)
    .where(isNull(schema.emailSubscribers.unsubscribedAt)).all();
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const suppressed = db.select().from(schema.emailSuppressions)
      .where(eq(schema.emailSuppressions.email, subscriber.email)).get();
    const delivered = db.select().from(schema.publicDigestDeliveries)
      .where(eq(schema.publicDigestDeliveries.subscriberId, subscriber.id)).all()
      .some((row) => row.weekStart === weekStart);
    if (suppressed || delivered) continue;

    const reportUrl = `${SITE_URL}/weekly/${weekStart}`;
    const unsubscribeUrl = getUnsubscribeUrl(subscriber.email);
    const summary = digest.prose.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
    try {
      const result = await sendAgencyEmail({
        to: subscriber.email,
        subject: `Agentic commerce intelligence: week of ${weekStart}`,
        text: `${digest.prose.join("\n\n")}\n\nRead the full report: ${reportUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
        html: emailShell(
          `Week of ${weekStart}`,
          `${summary}<p><a href="${reportUrl}">Read the full weekly report</a></p>`,
          unsubscribeUrl,
        ),
      });
      db.insert(schema.publicDigestDeliveries).values({
        subscriberId: subscriber.id,
        weekStart,
        providerMessageId: result.id,
      }).run();
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ weekStart, subscribers: subscribers.length, sent, failed });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}
