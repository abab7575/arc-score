import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, gte, sql, isNull, and } from "drizzle-orm";
import { sendEmail } from "@/lib/email/send";
import { watchlistInstantAlertEmail } from "@/lib/email/templates";

/**
 * Instant watchlist alert cron — runs every 30 minutes.
 *
 * Queries changelogEntries from the last 30 minutes where the change is
 * "severe": agent access flipped Open <-> Closed on a brand, OR a tracked
 * major agent (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) toggled.
 *
 * Dedupes per (brand, change) to avoid spamming when a scan writes multiple
 * rows for the same logical flip. Pro-only — free customers still get the
 * daily digest in watchlist-alerts.
 */

const WINDOW_MINUTES = 30;
const MAJOR_AGENTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"];

interface EvaluatedChange {
  brandId: number;
  brandName: string;
  brandSlug: string;
  change: string;
  severity: "high" | "medium";
  key: string;
}

function evaluateChange(row: {
  brandId: number;
  brandName: string;
  brandSlug: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
}): EvaluatedChange | null {
  const { field, oldValue, newValue } = row;

  if (field === "agent_access" || field === "overall_verdict" || field === "verdict") {
    const from = (oldValue || "").toLowerCase();
    const to = (newValue || "").toLowerCase();
    const openedUp = from.includes("closed") && (to.includes("open") || to.includes("partial"));
    const lockedDown = (from.includes("open") || from.includes("partial")) && to.includes("closed");
    if (openedUp) {
      return {
        brandId: row.brandId,
        brandName: row.brandName,
        brandSlug: row.brandSlug,
        change: "opened up to AI agents",
        severity: "high",
        key: `${row.brandId}:open`,
      };
    }
    if (lockedDown) {
      return {
        brandId: row.brandId,
        brandName: row.brandName,
        brandSlug: row.brandSlug,
        change: "blocked AI agents",
        severity: "high",
        key: `${row.brandId}:closed`,
      };
    }
  }

  for (const agent of MAJOR_AGENTS) {
    if (field === `agent:${agent}` || field === agent || field === `agent_${agent.toLowerCase()}`) {
      const to = (newValue || "").toLowerCase();
      if (to.includes("allow")) {
        return {
          brandId: row.brandId,
          brandName: row.brandName,
          brandSlug: row.brandSlug,
          change: `allowed ${agent}`,
          severity: "medium",
          key: `${row.brandId}:${agent}:allow`,
        };
      }
      if (to.includes("block") || to.includes("disallow")) {
        return {
          brandId: row.brandId,
          brandName: row.brandName,
          brandSlug: row.brandSlug,
          change: `blocked ${agent}`,
          severity: "medium",
          key: `${row.brandId}:${agent}:block`,
        };
      }
    }
  }

  return null;
}

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

  const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const recentChanges = db
    .select({
      brandId: schema.changelogEntries.brandId,
      field: schema.changelogEntries.field,
      oldValue: schema.changelogEntries.oldValue,
      newValue: schema.changelogEntries.newValue,
      brandName: schema.brands.name,
      brandSlug: schema.brands.slug,
    })
    .from(schema.changelogEntries)
    .innerJoin(schema.brands, eq(schema.changelogEntries.brandId, schema.brands.id))
    .where(gte(schema.changelogEntries.detectedAt, cutoff))
    .all();

  const byKey = new Map<string, EvaluatedChange>();
  for (const row of recentChanges) {
    const ev = evaluateChange(row);
    if (!ev) continue;
    if (!byKey.has(ev.key)) byKey.set(ev.key, ev);
  }

  if (byKey.size === 0) {
    return NextResponse.json({ status: "no_severe_changes", emailsSent: 0 });
  }

  const proWatchers = db
    .select({
      customerId: schema.watchlists.customerId,
      brandId: schema.watchlists.brandId,
      email: schema.customers.email,
      name: schema.customers.name,
      plan: schema.customers.plan,
    })
    .from(schema.watchlists)
    .innerJoin(schema.customers, eq(schema.watchlists.customerId, schema.customers.id))
    .where(
      and(
        sql`${schema.customers.plan} != 'free'`,
        isNull(schema.customers.unsubscribedAt),
      ),
    )
    .all();

  // Map brandId -> list of watchers
  const watchersByBrand = new Map<number, Array<{ email: string; name: string | null }>>();
  for (const w of proWatchers) {
    const list = watchersByBrand.get(w.brandId) ?? [];
    list.push({ email: w.email, name: w.name });
    watchersByBrand.set(w.brandId, list);
  }

  let emailsSent = 0;
  const errors: string[] = [];

  for (const change of byKey.values()) {
    const watchers = watchersByBrand.get(change.brandId);
    if (!watchers || watchers.length === 0) continue;

    for (const w of watchers) {
      const emailData = watchlistInstantAlertEmail({
        brandName: change.brandName,
        brandSlug: change.brandSlug,
        change: change.change,
        severity: change.severity,
      });
      const result = await sendEmail({ to: w.email, ...emailData });
      if (result.success) {
        emailsSent++;
      } else {
        errors.push(`${w.email}: ${result.error}`);
      }
    }
  }

  return NextResponse.json({
    status: "complete",
    severeChanges: byKey.size,
    emailsSent,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
