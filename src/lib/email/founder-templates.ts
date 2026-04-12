import type { FounderReport } from "@/lib/ops/founder-report";

function esc(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatUtc(iso: string | null | undefined): string {
  if (!iso) return "n/a";
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

function list(items: string[]): string {
  if (items.length === 0) {
    return `<p style="margin:0; color:#64748B;">None.</p>`;
  }

  return `<ul style="margin:0; padding-left:18px; color:#0F172A; line-height:1.6;">${items
    .map((item) => `<li>${esc(item)}</li>`)
    .join("")}</ul>`;
}

export function founderDigestEmail(report: FounderReport): {
  subject: string;
  html: string;
  text: string;
} {
  const latestRun = report.scanHealth.latestRun;

  const topChanges = report.changes.topChanges.slice(0, 5).map((change) =>
    `${change.brandName}: ${change.field} ${change.oldValue ?? "none"} -> ${change.newValue ?? "none"}`,
  );

  const topReady = report.outreach.topReady.slice(0, 3).map((item) =>
    `${item.brandName}${item.contactEmail ? ` (${item.contactEmail})` : ""}: ${item.subject}`,
  );

  const failureBuckets = report.latestFailureSummary.errorCounts.slice(0, 3).map((bucket) =>
    `${bucket.count}x ${bucket.error}`,
  );

  const subject = `ARC founder brief: ${report.scanHealth.overallStatus.toUpperCase()} | ${report.scanHealth.dataFreshness.percentage}% fresh | ${report.changes.detected24h} changes`;

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0; padding:24px; background:#F8FAFC; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#0F172A;">
  <div style="max-width:720px; margin:0 auto; background:#FFFFFF; border:1px solid #E2E8F0; padding:32px;">
    <p style="margin:0 0 8px; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#64748B;">Founder Brief</p>
    <h1 style="margin:0 0 12px; font-size:28px; line-height:1.2;">ARC reports to you.</h1>
    <p style="margin:0 0 24px; color:#475569;">Generated ${esc(formatUtc(report.generatedAt))}.</p>

    <h2 style="margin:24px 0 10px; font-size:18px;">Ops</h2>
    <p style="margin:0 0 8px;"><strong>Status:</strong> ${esc(report.scanHealth.overallStatus.toUpperCase())}</p>
    <p style="margin:0 0 8px;"><strong>Latest run:</strong> ${latestRun ? `${latestRun.completed}/${latestRun.totalBrands} complete, ${latestRun.failed} failed, ${latestRun.changesDetected} changes` : "No run found"}</p>
    <p style="margin:0 0 8px;"><strong>Completed at:</strong> ${esc(formatUtc(latestRun?.completedAt))}</p>
    <p style="margin:0 0 8px;"><strong>Freshness:</strong> ${report.scanHealth.dataFreshness.percentage}% (${report.scanHealth.dataFreshness.freshBrands}/${report.scanHealth.dataFreshness.totalBrands})</p>

    <h2 style="margin:24px 0 10px; font-size:18px;">Growth</h2>
    <p style="margin:0 0 8px;"><strong>New signups (24h):</strong> ${report.growth.newSignups24h}</p>
    <p style="margin:0 0 8px;"><strong>New subscribers (24h):</strong> ${report.growth.newSubscribers24h}</p>
    <p style="margin:0 0 8px;"><strong>Active paid customers:</strong> ${report.growth.activePaidCustomers}</p>
    <p style="margin:0 0 8px;"><strong>New paid customers (7d):</strong> ${report.growth.newPaidCustomers7d}</p>
    <p style="margin:0 0 8px;"><strong>Watchlists:</strong> ${report.growth.watchlistEntries} entries across ${report.growth.watchlistCustomers} customers</p>

    <h2 style="margin:24px 0 10px; font-size:18px;">Outreach</h2>
    <p style="margin:0 0 8px;"><strong>Ready now:</strong> ${report.outreach.ready}</p>
    <p style="margin:0 0 8px;"><strong>Queued:</strong> ${report.outreach.queued}</p>
    <p style="margin:0 0 8px;"><strong>Needs review:</strong> ${report.outreach.needsReview}</p>
    <p style="margin:0 0 8px;"><strong>Replies (7d):</strong> ${report.outreach.replied7d}</p>
    <div style="margin-top:12px;">
      <p style="margin:0 0 8px; font-weight:600;">Top outreach items</p>
      ${list(topReady)}
    </div>

    <h2 style="margin:24px 0 10px; font-size:18px;">Market Movement</h2>
    <p style="margin:0 0 8px;"><strong>Changes detected (24h):</strong> ${report.changes.detected24h}</p>
    ${list(topChanges)}

    <h2 style="margin:24px 0 10px; font-size:18px;">Failure Summary</h2>
    ${list(
      failureBuckets.length > 0
        ? failureBuckets
        : report.latestFailureSummary.failedBrands.slice(0, 5).map((brand) => `${brand.brandName}: ${brand.error}`),
    )}

    <h2 style="margin:24px 0 10px; font-size:18px;">Recommended Action</h2>
    <p style="margin:0; line-height:1.7;">${esc(report.recommendedAction)}</p>
  </div>
</body>
</html>`;

  const text = [
    "ARC founder brief",
    "",
    `Generated: ${formatUtc(report.generatedAt)}`,
    `Status: ${report.scanHealth.overallStatus.toUpperCase()}`,
    latestRun
      ? `Latest run: ${latestRun.completed}/${latestRun.totalBrands} complete, ${latestRun.failed} failed, ${latestRun.changesDetected} changes`
      : "Latest run: none",
    `Freshness: ${report.scanHealth.dataFreshness.percentage}%`,
    "",
    "Growth",
    `New signups (24h): ${report.growth.newSignups24h}`,
    `New subscribers (24h): ${report.growth.newSubscribers24h}`,
    `Active paid customers: ${report.growth.activePaidCustomers}`,
    `New paid customers (7d): ${report.growth.newPaidCustomers7d}`,
    "",
    "Outreach",
    `Ready: ${report.outreach.ready}`,
    `Queued: ${report.outreach.queued}`,
    `Needs review: ${report.outreach.needsReview}`,
    ...topReady.map((item) => `- ${item}`),
    "",
    "Changes",
    `Detected (24h): ${report.changes.detected24h}`,
    ...topChanges.map((item) => `- ${item}`),
    "",
    "Failure summary",
    ...(failureBuckets.length > 0 ? failureBuckets : ["No repeating failure bucket."]).map((item) => `- ${item}`),
    "",
    `Recommended action: ${report.recommendedAction}`,
  ].join("\n");

  return { subject, html, text };
}

export function founderAlertEmail(report: FounderReport): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[ARC critical] ${report.criticalAlerts.length} issue${report.criticalAlerts.length === 1 ? "" : "s"} need attention`;
  const bullets = report.criticalAlerts.map((alert) => `${alert.severity.toUpperCase()}: ${alert.message}`);
  const latestRun = report.scanHealth.latestRun;

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0; padding:24px; background:#FFF7ED; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#0F172A;">
  <div style="max-width:720px; margin:0 auto; background:#FFFFFF; border:1px solid #FDBA74; padding:32px;">
    <p style="margin:0 0 8px; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#C2410C;">Critical Alert</p>
    <h1 style="margin:0 0 12px; font-size:28px; line-height:1.2;">ARC needs attention.</h1>
    ${list(bullets)}
    <p style="margin:20px 0 8px;"><strong>Latest run:</strong> ${latestRun ? `${latestRun.completed}/${latestRun.totalBrands} complete, ${latestRun.failed} failed` : "No run found"}</p>
    <p style="margin:0;"><strong>Recommended action:</strong> ${esc(report.recommendedAction)}</p>
  </div>
</body>
</html>`;

  const text = [
    "ARC critical alert",
    "",
    ...bullets.map((item) => `- ${item}`),
    "",
    latestRun ? `Latest run: ${latestRun.completed}/${latestRun.totalBrands} complete, ${latestRun.failed} failed` : "Latest run: none",
    `Recommended action: ${report.recommendedAction}`,
  ].join("\n");

  return { subject, html, text };
}
