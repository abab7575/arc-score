import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, gte, sql } from "drizzle-orm";

/**
 * Daily watchlist alert cron — runs after the daily scan.
 * For each customer with a watchlist, checks if any of their watched brands
 * had changelog entries today, and sends a digest email via Resend.
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

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  // Get today's changelog entries
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const todayChanges = db
    .select({
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
    .where(gte(schema.changelogEntries.detectedAt, todayIso))
    .all();

  if (todayChanges.length === 0) {
    return NextResponse.json({ status: "no_changes", emailsSent: 0 });
  }

  // Group changes by brandId
  const changesByBrand = new Map<number, typeof todayChanges>();
  for (const change of todayChanges) {
    const list = changesByBrand.get(change.brandId) ?? [];
    list.push(change);
    changesByBrand.set(change.brandId, list);
  }

  // Get all watchlist entries with customer info
  const watchlistEntries = db
    .select({
      customerId: schema.watchlists.customerId,
      brandId: schema.watchlists.brandId,
      email: schema.customers.email,
      name: schema.customers.name,
      plan: schema.customers.plan,
    })
    .from(schema.watchlists)
    .innerJoin(schema.customers, eq(schema.watchlists.customerId, schema.customers.id))
    .where(sql`${schema.customers.plan} != 'free'`)
    .all();

  // Group by customer
  const customerWatches = new Map<number, { email: string; name: string | null; brandIds: number[] }>();
  for (const entry of watchlistEntries) {
    const existing = customerWatches.get(entry.customerId);
    if (existing) {
      existing.brandIds.push(entry.brandId);
    } else {
      customerWatches.set(entry.customerId, {
        email: entry.email,
        name: entry.name,
        brandIds: [entry.brandId],
      });
    }
  }

  let emailsSent = 0;
  const errors: string[] = [];

  for (const [customerId, customer] of customerWatches) {
    // Find changes for this customer's watched brands
    const relevantChanges: typeof todayChanges = [];
    for (const brandId of customer.brandIds) {
      const brandChanges = changesByBrand.get(brandId);
      if (brandChanges) relevantChanges.push(...brandChanges);
    }

    if (relevantChanges.length === 0) continue;

    // Build email body
    const changeLines = relevantChanges.map((c) =>
      `- ${c.brandName}: ${c.field} changed from "${c.oldValue ?? "none"}" to "${c.newValue ?? "none"}"`
    ).join("\n");

    const htmlChanges = relevantChanges.map((c) =>
      `<li><strong>${c.brandName}</strong>: <code>${c.field}</code> — <del>${c.oldValue ?? "none"}</del> → <strong>${c.newValue ?? "none"}</strong> <a href="https://arcreport.ai/brand/${c.brandSlug}">[view]</a></li>`
    ).join("");

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "ARC Report <alerts@arcreport.ai>",
          to: customer.email,
          subject: `ARC Alert: ${relevantChanges.length} change${relevantChanges.length === 1 ? "" : "s"} on your watchlist`,
          html: `
            <h2>Watchlist Alert</h2>
            <p>Hi${customer.name ? ` ${customer.name}` : ""},</p>
            <p>${relevantChanges.length} change${relevantChanges.length === 1 ? " was" : "s were"} detected on brands you're tracking:</p>
            <ul>${htmlChanges}</ul>
            <p><a href="https://arcreport.ai/account/watchlist">View your watchlist</a></p>
            <p style="color:#888;font-size:12px;">You're receiving this because you have an active ARC Report watchlist.</p>
          `,
          text: `Watchlist Alert\n\n${relevantChanges.length} changes detected:\n\n${changeLines}\n\nView your watchlist: https://arcreport.ai/account/watchlist`,
        }),
      });

      if (res.ok) {
        emailsSent++;
      } else {
        const body = await res.text();
        errors.push(`Customer ${customerId}: ${res.status} ${body}`);
      }
    } catch (e) {
      errors.push(`Customer ${customerId}: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  return NextResponse.json({
    status: "complete",
    todayChanges: todayChanges.length,
    customersChecked: customerWatches.size,
    emailsSent,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
