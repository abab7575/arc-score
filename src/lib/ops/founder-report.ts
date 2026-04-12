import { db, schema } from "@/lib/db";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getScanHealth } from "@/lib/scanner/scan-worker";

interface FailureReport {
  failedBrands?: Array<{
    brandId: number;
    slug: string;
    name: string;
    error: string;
  }>;
  errorCounts?: Array<{
    error: string;
    count: number;
  }>;
}

interface CriticalAlert {
  id: string;
  severity: "critical" | "warning";
  message: string;
}

export interface FounderReport {
  generatedAt: string;
  scanHealth: ReturnType<typeof getScanHealth>;
  growth: {
    newSignups24h: number;
    newSubscribers24h: number;
    activePaidCustomers: number;
    newPaidCustomers7d: number;
    watchlistCustomers: number;
    watchlistEntries: number;
  };
  outreach: {
    total: number;
    queued: number;
    ready: number;
    needsReview: number;
    sent7d: number;
    replied7d: number;
    converted7d: number;
    topReady: Array<{
      id: number;
      brandName: string;
      brandSlug: string;
      contactEmail: string | null;
      subject: string;
      issueCount: number;
      createdAt: string;
      status: string;
    }>;
  };
  changes: {
    detected24h: number;
    topChanges: Array<{
      brandName: string;
      brandSlug: string;
      field: string;
      oldValue: string | null;
      newValue: string | null;
      detectedAt: string;
    }>;
  };
  latestFailureSummary: {
    failedBrands: Array<{
      brandSlug: string;
      brandName: string;
      error: string | null;
    }>;
    errorCounts: Array<{
      error: string;
      count: number;
    }>;
  };
  criticalAlerts: CriticalAlert[];
  recommendedAction: string;
}

function distinctCount<T>(values: T[]): number {
  return new Set(values).size;
}

function buildCriticalAlerts(report: Omit<FounderReport, "criticalAlerts" | "recommendedAction">): CriticalAlert[] {
  const alerts: CriticalAlert[] = [];
  const latestRun = report.scanHealth.latestRun;
  const now = new Date();
  const utcHour = now.getUTCHours();

  if (report.scanHealth.overallStatus === "red") {
    alerts.push({
      id: "scan-health-red",
      severity: "critical",
      message: "Production scan health is red.",
    });
  }

  if (report.scanHealth.dataFreshness.percentage < 95) {
    alerts.push({
      id: "freshness-low",
      severity: report.scanHealth.dataFreshness.percentage < 85 ? "critical" : "warning",
      message: `Fresh data coverage is ${report.scanHealth.dataFreshness.percentage}% (${report.scanHealth.dataFreshness.freshBrands}/${report.scanHealth.dataFreshness.totalBrands}).`,
    });
  }

  if (utcHour >= 5 && !report.scanHealth.todayRun) {
    alerts.push({
      id: "today-run-missing",
      severity: "critical",
      message: "No scan run has completed today after the normal scan window.",
    });
  }

  if (latestRun?.status && latestRun.status !== "completed") {
    alerts.push({
      id: "latest-run-incomplete",
      severity: "critical",
      message: `Latest scan run is ${latestRun.status}.`,
    });
  }

  if (latestRun?.totalBrands && latestRun.failed / latestRun.totalBrands > 0.05) {
    alerts.push({
      id: "failure-rate-high",
      severity: latestRun.failed / latestRun.totalBrands > 0.1 ? "critical" : "warning",
      message: `Latest scan failure rate is ${latestRun.failed}/${latestRun.totalBrands}.`,
    });
  }

  if (report.latestFailureSummary.errorCounts.length > 0) {
    const topError = report.latestFailureSummary.errorCounts[0];
    if (topError.count >= 10) {
      alerts.push({
        id: "repeating-failure-bucket",
        severity: "warning",
        message: `Top failure bucket is repeating across ${topError.count} brands: ${topError.error}`,
      });
    }
  }

  if (report.outreach.ready === 0 && report.outreach.queued === 0) {
    alerts.push({
      id: "outreach-empty",
      severity: "warning",
      message: "Outreach queue is empty.",
    });
  }

  return alerts;
}

function buildRecommendedAction(report: Omit<FounderReport, "recommendedAction">): string {
  if (report.criticalAlerts.some((alert) => alert.severity === "critical")) {
    return "Fix scan reliability first: review the latest failure buckets and confirm the next run completes cleanly.";
  }

  if (report.outreach.ready > 0) {
    return `Send the top ${Math.min(3, report.outreach.ready)} ready outreach email${report.outreach.ready === 1 ? "" : "s"} and reply to any human responses.`;
  }

  if (report.outreach.queued > 0) {
    return "Run email discovery on the queued outreach drafts so tomorrow starts with ready-to-send contacts.";
  }

  if (report.growth.newSignups24h > 0 && report.growth.newPaidCustomers7d === 0) {
    return "Follow up with recent signups and convert at least one into a live conversation.";
  }

  if (report.changes.detected24h > 0) {
    return "Review the biggest signal changes from the last 24 hours and turn one into outreach or a content angle.";
  }

  return "Keep the system boring: confirm the digest, skim the top changes, and only make one product or GTM decision today.";
}

export function getFounderReport(): FounderReport {
  const generatedAt = new Date().toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const scanHealth = getScanHealth();

  const newSignups24h = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.customers)
    .where(gte(schema.customers.createdAt, dayAgo))
    .get()?.count ?? 0;

  const newSubscribers24h = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.emailSubscribers)
    .where(gte(schema.emailSubscribers.createdAt, dayAgo))
    .get()?.count ?? 0;

  const activePaidCustomers = distinctCount(
    db
      .select({ customerId: schema.subscriptions.customerId })
      .from(schema.subscriptions)
      .where(
        and(
          inArray(schema.subscriptions.status, ["active", "trialing"]),
          inArray(schema.subscriptions.plan, ["pro", "agency"]),
        ),
      )
      .all()
      .map((row) => row.customerId),
  );

  const newPaidCustomers7d = distinctCount(
    db
      .select({ customerId: schema.subscriptions.customerId })
      .from(schema.subscriptions)
      .where(
        and(
          gte(schema.subscriptions.createdAt, weekAgo),
          inArray(schema.subscriptions.status, ["active", "trialing"]),
          inArray(schema.subscriptions.plan, ["pro", "agency"]),
        ),
      )
      .all()
      .map((row) => row.customerId),
  );

  const watchlistRows = db
    .select({
      customerId: schema.watchlists.customerId,
    })
    .from(schema.watchlists)
    .all();

  const outreachRows = db
    .select({
      id: schema.outreach.id,
      brandId: schema.outreach.brandId,
      contactEmail: schema.outreach.contactEmail,
      subject: schema.outreach.subject,
      issueCount: schema.outreach.issueCount,
      createdAt: schema.outreach.createdAt,
      sentAt: schema.outreach.sentAt,
      repliedAt: schema.outreach.repliedAt,
      status: schema.outreach.status,
    })
    .from(schema.outreach)
    .orderBy(desc(schema.outreach.createdAt))
    .all();

  const topReady = outreachRows
    .filter((row) => row.status === "ready" || row.status === "queued" || row.status === "needs_review")
    .slice(0, 5)
    .map((row) => {
      const brand = db
        .select({ name: schema.brands.name, slug: schema.brands.slug })
        .from(schema.brands)
        .where(eq(schema.brands.id, row.brandId))
        .get();

      return {
        id: row.id,
        brandName: brand?.name ?? "Unknown",
        brandSlug: brand?.slug ?? "",
        contactEmail: row.contactEmail,
        subject: row.subject,
        issueCount: row.issueCount,
        createdAt: row.createdAt,
        status: row.status,
      };
    });

  const detected24h = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.changelogEntries)
    .where(gte(schema.changelogEntries.detectedAt, dayAgo))
    .get()?.count ?? 0;

  const topChanges = db
    .select({
      brandName: schema.brands.name,
      brandSlug: schema.brands.slug,
      field: schema.changelogEntries.field,
      oldValue: schema.changelogEntries.oldValue,
      newValue: schema.changelogEntries.newValue,
      detectedAt: schema.changelogEntries.detectedAt,
    })
    .from(schema.changelogEntries)
    .innerJoin(schema.brands, eq(schema.changelogEntries.brandId, schema.brands.id))
    .where(gte(schema.changelogEntries.detectedAt, dayAgo))
    .orderBy(desc(schema.changelogEntries.detectedAt))
    .limit(6)
    .all();

  const latestRunRow = scanHealth.latestRun
    ? db
        .select({ failureReport: schema.scanRuns.failureReport })
        .from(schema.scanRuns)
        .where(eq(schema.scanRuns.id, scanHealth.latestRun.id))
        .get()
    : null;

  let parsedFailureReport: FailureReport | null = null;
  if (latestRunRow?.failureReport) {
    try {
      parsedFailureReport = JSON.parse(latestRunRow.failureReport) as FailureReport;
    } catch {
      // ignore parse errors
    }
  }

  const latestFailureSummary = {
    failedBrands:
      scanHealth.failedBrands.length > 0
        ? scanHealth.failedBrands.slice(0, 10)
        : (parsedFailureReport?.failedBrands ?? []).slice(0, 10).map((brand) => ({
            brandSlug: brand.slug,
            brandName: brand.name,
            error: brand.error,
          })),
    errorCounts: parsedFailureReport?.errorCounts?.slice(0, 5) ?? [],
  };

  const baseReport = {
    generatedAt,
    scanHealth,
    growth: {
      newSignups24h,
      newSubscribers24h,
      activePaidCustomers,
      newPaidCustomers7d,
      watchlistCustomers: distinctCount(watchlistRows.map((row) => row.customerId)),
      watchlistEntries: watchlistRows.length,
    },
    outreach: {
      total: outreachRows.length,
      queued: outreachRows.filter((row) => row.status === "queued").length,
      ready: outreachRows.filter((row) => row.status === "ready").length,
      needsReview: outreachRows.filter((row) => row.status === "needs_review").length,
      sent7d: outreachRows.filter((row) => row.sentAt && row.sentAt >= weekAgo).length,
      replied7d: outreachRows.filter((row) => row.repliedAt && row.repliedAt >= weekAgo).length,
      converted7d: outreachRows.filter((row) => row.status === "converted" && row.createdAt >= weekAgo).length,
      topReady,
    },
    changes: {
      detected24h,
      topChanges,
    },
    latestFailureSummary,
  };

  const criticalAlerts = buildCriticalAlerts(baseReport);
  return {
    ...baseReport,
    criticalAlerts,
    recommendedAction: buildRecommendedAction({ ...baseReport, criticalAlerts }),
  };
}
