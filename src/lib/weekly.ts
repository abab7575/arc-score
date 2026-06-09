/**
 * Weekly digest builder (E2). Weeks are ISO weeks keyed by their Monday
 * (UTC), e.g. /weekly/2026-06-01. A digest is auto-generated prose +
 * grouped tables from the confirmed changes inside [monday, monday+7d).
 */

import { db, schema } from "@/lib/db";
import { and, gte, lt, desc, eq, sql } from "drizzle-orm";

export interface WeeklyChange {
  id: number;
  brandSlug: string;
  brandName: string;
  brandCategory: string | null;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  detectedAt: string;
}

export interface WeeklyDigest {
  weekStart: string; // Monday, YYYY-MM-DD
  weekEnd: string;   // Sunday, YYYY-MM-DD (inclusive label)
  totalChanges: number;
  brandsMoving: number;
  blocks: WeeklyChange[];        // newly blocked/restricted agents
  opens: WeeklyChange[];         // newly allowed agents
  llmsAdopters: WeeklyChange[];
  platformShifts: WeeklyChange[];
  topMovers: Array<{ brandSlug: string; brandName: string; changeCount: number }>;
  prose: string[];               // auto-generated paragraphs
}

export function mondayOf(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split("T")[0];
}

export function isMonday(dateIso: string): boolean {
  return new Date(`${dateIso}T00:00:00Z`).getUTCDay() === 1;
}

function addDays(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function changesBetween(startIso: string, endIso: string): WeeklyChange[] {
  return db
    .select({
      id: schema.changelogEntries.id,
      field: schema.changelogEntries.field,
      oldValue: schema.changelogEntries.oldValue,
      newValue: schema.changelogEntries.newValue,
      detectedAt: schema.changelogEntries.detectedAt,
      brandSlug: schema.brands.slug,
      brandName: schema.brands.name,
      brandCategory: schema.brands.category,
    })
    .from(schema.changelogEntries)
    .innerJoin(schema.brands, eq(schema.changelogEntries.brandId, schema.brands.id))
    .where(
      and(
        gte(schema.changelogEntries.detectedAt, `${startIso}T00:00:00.000Z`),
        lt(schema.changelogEntries.detectedAt, `${endIso}T00:00:00.000Z`),
      ),
    )
    .orderBy(desc(schema.changelogEntries.detectedAt))
    .all();
}

const isAgentField = (f: string) =>
  f.startsWith("agent_access_") || f.startsWith("agent_ua_") || f.endsWith(" robots.txt");

export function buildWeeklyDigest(weekStart: string): WeeklyDigest {
  const weekEndExclusive = addDays(weekStart, 7);
  const changes = changesBetween(weekStart, weekEndExclusive);

  const blocks = changes.filter(
    (c) => isAgentField(c.field) && (c.newValue === "blocked" || c.newValue === "restricted"),
  );
  const opens = changes.filter(
    (c) => isAgentField(c.field) && (c.newValue === "allowed" || c.newValue === "no_rule") &&
      (c.oldValue === "blocked" || c.oldValue === "restricted"),
  );
  const llmsAdopters = changes.filter((c) => c.field === "llms_txt" && (c.newValue === "true" || c.newValue === "1"));
  const platformShifts = changes.filter((c) => ["platform", "cdn", "waf"].includes(c.field));

  const moverCounts = new Map<string, { brandSlug: string; brandName: string; changeCount: number }>();
  for (const c of changes) {
    const m = moverCounts.get(c.brandSlug) ?? { brandSlug: c.brandSlug, brandName: c.brandName, changeCount: 0 };
    m.changeCount += 1;
    moverCounts.set(c.brandSlug, m);
  }
  const topMovers = [...moverCounts.values()].sort((a, b) => b.changeCount - a.changeCount).slice(0, 10);
  const brandsMoving = moverCounts.size;

  // Auto-generated prose, in plain sentences
  const prose: string[] = [];
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
  const weekLabel = `the week of ${fmt(weekStart)}`;

  if (changes.length === 0) {
    prose.push(
      `A quiet week: no confirmed agent-access changes were detected across the index in ${weekLabel}. Quiet weeks are data too — most brands' AI access posture is static most of the time.`,
    );
  } else {
    prose.push(
      `In ${weekLabel}, ARC Report confirmed ${changes.length} change${changes.length === 1 ? "" : "s"} across ${brandsMoving} brand${brandsMoving === 1 ? "" : "s"}.`,
    );
    if (blocks.length > 0) {
      const names = [...new Set(blocks.map((b) => b.brandName))].slice(0, 5);
      prose.push(
        `The biggest blocks: ${blocks.length} agent-access signal${blocks.length === 1 ? "" : "s"} flipped to blocked or restricted, led by ${names.join(", ")}${blocks.length > names.length ? " and others" : ""}.`,
      );
    }
    if (opens.length > 0) {
      const names = [...new Set(opens.map((b) => b.brandName))].slice(0, 5);
      prose.push(
        `The biggest opens: ${opens.length} previously blocked or restricted signal${opens.length === 1 ? "" : "s"} opened up, including ${names.join(", ")}.`,
      );
    }
    if (llmsAdopters.length > 0) {
      prose.push(
        `${llmsAdopters.length} brand${llmsAdopters.length === 1 ? "" : "s"} began publishing llms.txt: ${[...new Set(llmsAdopters.map((b) => b.brandName))].slice(0, 6).join(", ")}.`,
      );
    }
    if (platformShifts.length > 0) {
      prose.push(
        `${platformShifts.length} infrastructure shift${platformShifts.length === 1 ? "" : "s"} (platform, CDN, or WAF) were confirmed — WAF changes in particular often change effective agent access without any robots.txt edit.`,
      );
    }
  }

  return {
    weekStart,
    weekEnd: addDays(weekStart, 6),
    totalChanges: changes.length,
    brandsMoving,
    blocks: blocks.slice(0, 30),
    opens: opens.slice(0, 30),
    llmsAdopters: llmsAdopters.slice(0, 30),
    platformShifts: platformShifts.slice(0, 30),
    topMovers,
    prose,
  };
}

/** All archive week-start dates (Mondays, newest first) covered by changelog data. */
export function getArchiveWeeks(): string[] {
  const range = db
    .select({
      min: sql<string | null>`MIN(substr(detected_at, 1, 10))`,
      max: sql<string | null>`MAX(substr(detected_at, 1, 10))`,
    })
    .from(schema.changelogEntries)
    .get();
  if (!range?.min || !range.max) return [];

  const weeks: string[] = [];
  let cursor = mondayOf(range.max);
  const first = mondayOf(range.min);
  // Don't list the in-progress week (it becomes a digest once complete)
  const currentWeek = mondayOf(new Date().toISOString().split("T")[0]);
  if (cursor === currentWeek) cursor = addDays(cursor, -7);
  while (cursor >= first) {
    weeks.push(cursor);
    cursor = addDays(cursor, -7);
  }
  return weeks;
}
