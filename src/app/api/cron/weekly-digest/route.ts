import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, gte, desc, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email/send";
import { weeklyDigestEmail } from "@/lib/email/templates";
import { getTopMovers, getWeeklyTotals, getRecentChangelog } from "@/lib/db/queries";

/**
 * Weekly digest cron — sends the weekly summary to all email subscribers.
 * Runs every Sunday at 10 AM UTC.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gather weekly data
  const totals = getWeeklyTotals(7);
  const topMovers = getTopMovers(7, 10);

  // Get notable changes (robots.txt and agent access changes from the week)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const notableChanges = db
    .select({
      id: schema.changelogEntries.id,
      brandId: schema.changelogEntries.brandId,
      field: schema.changelogEntries.field,
      oldValue: schema.changelogEntries.oldValue,
      newValue: schema.changelogEntries.newValue,
      detectedAt: schema.changelogEntries.detectedAt,
      brandName: schema.brands.name,
      brandSlug: schema.brands.slug,
    })
    .from(schema.changelogEntries)
    .innerJoin(schema.brands, eq(schema.changelogEntries.brandId, schema.brands.id))
    .where(gte(schema.changelogEntries.detectedAt, weekAgo))
    .orderBy(desc(schema.changelogEntries.detectedAt))
    .limit(10)
    .all();

  if (totals.totalChanges === 0) {
    return NextResponse.json({ status: "no_changes", emailsSent: 0 });
  }

  // Build the email
  const emailData = weeklyDigestEmail({
    totalChanges: totals.totalChanges,
    brandsMoving: totals.brandsMoving,
    topMovers: topMovers.map(m => ({
      brandName: m.brandName,
      brandSlug: m.brandSlug,
      changeCount: m.changeCount,
    })),
    notableChanges: notableChanges.map(c => ({
      brandName: c.brandName,
      brandSlug: c.brandSlug,
      field: c.field,
      oldValue: c.oldValue,
      newValue: c.newValue,
    })),
  });

  // Get all email subscribers
  const subscribers = db
    .select({ email: schema.emailSubscribers.email })
    .from(schema.emailSubscribers)
    .all();

  let emailsSent = 0;
  const errors: string[] = [];

  for (const subscriber of subscribers) {
    const result = await sendEmail({ to: subscriber.email, ...emailData });
    if (result.success) {
      emailsSent++;
    } else {
      errors.push(`${subscriber.email}: ${result.error}`);
    }
  }

  return NextResponse.json({
    status: "complete",
    subscriberCount: subscribers.length,
    emailsSent,
    totalChanges: totals.totalChanges,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
