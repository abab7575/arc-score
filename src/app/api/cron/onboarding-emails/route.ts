import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email/send";
import { onboardingDay2Email } from "@/lib/email/templates";

/**
 * Onboarding follow-up cron — sends day-2 email to new customers.
 * Run daily.
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

  const now = new Date();

  const day2Start = new Date(now);
  day2Start.setDate(day2Start.getDate() - 2);
  day2Start.setHours(0, 0, 0, 0);
  const day2End = new Date(day2Start);
  day2End.setHours(23, 59, 59, 999);

  const day2Customers = db
    .select({
      id: schema.customers.id,
      email: schema.customers.email,
      name: schema.customers.name,
      plan: schema.customers.plan,
    })
    .from(schema.customers)
    .where(
      sql`${schema.customers.createdAt} >= ${day2Start.toISOString()} AND ${schema.customers.createdAt} <= ${day2End.toISOString()}`
    )
    .all();

  let day2Sent = 0;
  const errors: string[] = [];

  for (const customer of day2Customers) {
    const emailData = onboardingDay2Email({
      name: customer.name,
      plan: customer.plan,
    });

    const result = await sendEmail({ to: customer.email, ...emailData });
    if (result.success) {
      day2Sent++;
    } else {
      errors.push(`Day-2 customer ${customer.id}: ${result.error}`);
    }
  }

  return NextResponse.json({
    status: "complete",
    day2: { eligible: day2Customers.length, sent: day2Sent },
    totalSent: day2Sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
