import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { db, schema } from "@/lib/db";
import { sql, desc } from "drizzle-orm";
import { getMatrixData } from "@/lib/db/queries";
import { getFailureInsights } from "@/lib/scan-failures";
import { TRACKED_AGENT_IDS, CONTACT_EMAIL } from "@/lib/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reliability — Scan Success Rates & Corrections | ARC Report",
  description:
    "How reliable is ARC Report data? Scan success rates, false-positive handling via the two-scan confirmation rule, a public corrections log, and the data dispute process.",
};

/**
 * Corrections log — every manual correction to published data gets an entry
 * here (date, brand, what was wrong, what we changed). Public by design.
 */
const CORRECTIONS: Array<{
  date: string;
  brand: string;
  summary: string;
}> = [
  // No manual corrections issued yet. Add entries newest-first.
];

export default function ReliabilityPage() {
  // Recent scan runs (production pipeline writes these; may be empty locally)
  const runs = db
    .select()
    .from(schema.scanRuns)
    .orderBy(desc(schema.scanRuns.id))
    .limit(14)
    .all();

  const completedRuns = runs.filter((r) => r.status === "completed" && r.totalBrands > 0);
  const avgSuccess =
    completedRuns.length > 0
      ? Math.round(
          (completedRuns.reduce((s, r) => s + r.completedCount / r.totalBrands, 0) /
            completedRuns.length) *
            1000,
        ) / 10
      : null;

  // Verdict conclusiveness across the latest scan of every brand
  const data = getMatrixData().filter((d) => d.scan !== null);
  let totalVerdicts = 0;
  let conclusiveVerdicts = 0;
  let brandsWithInconclusive = 0;
  let freshBrands = 0;
  const cutoff48h = new Date(Date.now() - 48 * 3600_000).toISOString();
  for (const { scan } of data) {
    if (!scan) continue;
    if (scan.scannedAt >= cutoff48h) freshBrands += 1;
    try {
      const status = JSON.parse(scan.agentStatusJson) as Record<string, string>;
      let hadInconclusive = false;
      for (const a of TRACKED_AGENT_IDS) {
        totalVerdicts += 1;
        if ((status[a] ?? "inconclusive") !== "inconclusive") conclusiveVerdicts += 1;
        else hadInconclusive = true;
      }
      if (hadInconclusive) brandsWithInconclusive += 1;
    } catch {
      brandsWithInconclusive += 1;
    }
  }
  const conclusiveRate =
    totalVerdicts > 0 ? Math.round((conclusiveVerdicts / totalVerdicts) * 1000) / 10 : 0;

  const failures = getFailureInsights(7);
  const persistent = failures.repeatOffenders.filter((o) => o.consecutiveRuns >= 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="spec-label text-muted-foreground mb-2">RELIABILITY</div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            How much should you trust this data?
          </h1>
          <p className="text-base text-muted-foreground">
            Scanning the open web is noisy. This page publishes our own error surface: scan
            success rates, how false positives are prevented, every manual correction we have
            issued, and how to dispute a data point.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Current measurements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-gray-200 bg-white px-4 py-3">
              <div className="text-2xl font-black font-mono text-foreground">{conclusiveRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                of per-agent checks returned a conclusive verdict in the latest scan
                ({conclusiveVerdicts.toLocaleString()} of {totalVerdicts.toLocaleString()})
              </div>
            </div>
            <div className="border border-gray-200 bg-white px-4 py-3">
              <div className="text-2xl font-black font-mono text-foreground">{brandsWithInconclusive}</div>
              <div className="text-xs text-muted-foreground mt-1">
                brands with ≥1 inconclusive agent verdict (of {data.length.toLocaleString()} scanned)
              </div>
            </div>
            <div className="border border-gray-200 bg-white px-4 py-3">
              <div className="text-2xl font-black font-mono text-foreground">
                {avgSuccess !== null ? `${avgSuccess}%` : "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {avgSuccess !== null
                  ? `average per-run scan completion across the last ${completedRuns.length} pipeline runs`
                  : "per-run completion rate (pipeline run history not yet available on this deployment)"}
              </div>
            </div>
          </div>
        </section>

        {runs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
              Recent scan runs
            </h2>
            <div className="border border-gray-200 bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-4 py-2.5 font-semibold">Started (UTC)</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Brands</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Completed</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Failed</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{r.startedAt?.replace("T", " ").slice(0, 16) ?? "—"}</td>
                      <td className="px-4 py-2">{r.status}</td>
                      <td className="px-4 py-2 text-right font-mono">{r.totalBrands}</td>
                      <td className="px-4 py-2 text-right font-mono">{r.completedCount}</td>
                      <td className="px-4 py-2 text-right font-mono">{r.failedCount}</td>
                      <td className="px-4 py-2 text-right font-mono">{r.changesDetected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {failures.latestBuckets.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
              Why scans fail
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Error breakdown from the latest completed run. Failed brands get one calm retry
              (lower concurrency, doubled timeout) before being counted here.
            </p>
            <div className="border border-gray-200 bg-white overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-4 py-2.5 font-semibold">Error</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Brands</th>
                  </tr>
                </thead>
                <tbody>
                  {failures.latestBuckets.map((b) => (
                    <tr key={b.error} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-2 font-mono text-xs break-all">{b.error}</td>
                      <td className="px-4 py-2 text-right font-mono">{b.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {persistent.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  {persistent.length} brand{persistent.length === 1 ? "" : "s"} failed{" "}
                  {persistent.length === 1 ? "its" : "their"} last 3+ consecutive scans
                  (of {failures.runsExamined} runs examined). Persistent failers are reviewed
                  for removal or reclassification — a site that blocks our scanner is recorded
                  as a finding, not silently dropped.
                </p>
                <div className="border border-gray-200 bg-white max-h-56 overflow-y-auto">
                  {persistent.slice(0, 30).map((o) => (
                    <div key={o.slug} className="flex items-baseline gap-3 px-4 py-2 text-xs border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-foreground w-36 truncate shrink-0">{o.name}</span>
                      <span className="font-mono text-muted-foreground w-16 shrink-0">{o.consecutiveRuns}/{failures.runsExamined} runs</span>
                      <span className="font-mono text-muted-foreground truncate">{o.lastError}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            False-positive handling
          </h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>
              <strong className="text-foreground">Two-scan confirmation:</strong> inference-based
              changes (HTTP verdicts, WAF/CDN, structured data) must appear in two consecutive
              daily scans before publishing. robots.txt diffs publish immediately because they are
              literal text changes. Details on{" "}
              <Link href="/methodology" className="text-[#0259DD] hover:underline">/methodology</Link>.
            </li>
            <li>
              <strong className="text-foreground">Scanner failures are never brand changes:</strong>{" "}
              timeouts, HTTP 429s, and network errors are recorded as inconclusive and excluded
              from the changelog.
            </li>
            <li>
              <strong className="text-foreground">Policy vs enforcement separation:</strong> a WAF
              block is published as <code className="font-mono text-xs">restricted</code>, never
              conflated with a robots.txt <code className="font-mono text-xs">blocked</code>.
            </li>
            <li>
              <strong className="text-foreground">Confidence labels:</strong> changelog entries are
              tagged high / medium / low confidence based on how the signal is measured.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Corrections log
          </h2>
          {CORRECTIONS.length === 0 ? (
            <div className="border border-gray-200 bg-white px-4 py-6 text-sm text-muted-foreground">
              No manual corrections issued yet. When we correct published data, the entry appears
              here permanently: date, brand, what was wrong, and what changed.
            </div>
          ) : (
            <div className="border border-gray-200 bg-white divide-y divide-gray-100">
              {CORRECTIONS.map((c) => (
                <div key={`${c.date}-${c.brand}`} className="px-4 py-3 text-sm">
                  <span className="font-mono text-xs text-muted-foreground mr-3">{c.date}</span>
                  <span className="font-semibold text-foreground mr-2">{c.brand}</span>
                  <span className="text-muted-foreground">{c.summary}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border-2 border-[#0259DD]/20 bg-blue-50/40 px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">
            Dispute this data
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            If you represent a brand and believe a published data point is wrong:
          </p>
          <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal pl-5 mb-4">
            <li>
              Email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=%5BDATA%20DISPUTE%5D%20your-domain.com&body=Brand%20domain%3A%0AField%20in%20dispute%20(e.g.%20GPTBot%20access%2C%20platform)%3A%0AWhat%20ARC%20Report%20shows%3A%0AWhat%20you%20believe%20is%20correct%3A%0AEvidence%20(URLs%2C%20headers%2C%20robots.txt%20lines)%3A`}
                className="text-[#0259DD] hover:underline font-semibold"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              with subject{" "}
              <code className="font-mono text-xs bg-white border border-gray-200 px-1.5 py-0.5">
                [DATA DISPUTE] your-domain.com
              </code>{" "}
              (the link pre-fills the required fields).
            </li>
            <li>We re-scan the brand out of band within 2 business days and compare against your evidence.</li>
            <li>
              If we were wrong, we fix the data, add a permanent entry to the corrections log
              above, and reply with what changed. If the data stands, we reply with the raw scan
              evidence so you can reproduce it.
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Disputes never silently edit history: corrected values appear in the changelog like
            any other change.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
