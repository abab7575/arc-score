import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email/send";
import { founderDigestEmail } from "@/lib/email/founder-templates";
import { getFounderReport } from "@/lib/ops/founder-report";

function parseRecipients(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.includes("@"));
}

function upsertSystemState(key: string, value: string) {
  const updated = db
    .update(schema.systemState)
    .set({ value, updatedAt: new Date().toISOString() })
    .where(eq(schema.systemState.key, key))
    .run();

  if (updated.changes === 0) {
    db.insert(schema.systemState)
      .values({ key, value, updatedAt: new Date().toISOString() })
      .run();
  }
}

function authorize(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function POST(request: NextRequest) {
  const authError = authorize(request);
  if (authError) return authError;

  const recipients = parseRecipients(process.env.FOUNDER_DIGEST_EMAILS ?? process.env.FOUNDER_EMAILS);
  if (recipients.length === 0) {
    return NextResponse.json({
      status: "disabled",
      reason: "FOUNDER_DIGEST_EMAILS or FOUNDER_EMAILS not configured",
    });
  }

  const force = request.nextUrl.searchParams.get("force") === "true";
  const today = new Date().toISOString().slice(0, 10);
  const lastSent = db
    .select({ value: schema.systemState.value })
    .from(schema.systemState)
    .where(eq(schema.systemState.key, "founder_digest_last_sent_on"))
    .get();

  if (!force && lastSent?.value === today) {
    return NextResponse.json({ status: "skipped", reason: "Digest already sent today" });
  }

  const report = getFounderReport();
  const emailData = founderDigestEmail(report);

  let sent = 0;
  const errors: string[] = [];
  for (const recipient of recipients) {
    const result = await sendEmail({
      to: recipient,
      ...emailData,
    });

    if (result.success) {
      sent++;
    } else {
      errors.push(`${recipient}: ${result.error}`);
    }
  }

  if (sent > 0) {
    upsertSystemState("founder_digest_last_sent_on", today);
  }

  return NextResponse.json({
    status: sent > 0 ? "complete" : "failed",
    recipients: recipients.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
    recommendedAction: report.recommendedAction,
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
