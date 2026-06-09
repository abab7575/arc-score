import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { EmailCapture } from "@/components/shared/email-capture";
import { getMatrixData } from "@/lib/db/queries";
import { computeArcScore } from "@/lib/scoring/arc-score";
import type { Metadata } from "next";
import { PRO_PRICE_MONTHLY } from "@/lib/site";

// Server-rendered with hourly revalidation (rankings move once per daily scan).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI-Ready Leaderboard — ARC Report",
  description:
    "Which brands are most open to AI shopping agents, and which are blocking them? Updated daily from 1,000+ brand scans.",
};

export default function LeaderboardPage() {
  const matrix = getMatrixData().filter((entry) => entry.scan !== null);

  // Rank brands by ARC Score v1.0 (see /methodology#score)
  const scored = matrix.map(({ brand, scan }) => {
    if (!scan) return null;

    let agentStatus: Record<string, string> = {};
    try {
      agentStatus = JSON.parse(scan.agentStatusJson);
    } catch {
      agentStatus = {};
    }

    const agents = Object.values(agentStatus);
    const totalAgents = agents.length || 1;
    const openAgents = agents.filter(
      (s) => s === "allowed" || s === "no_rule",
    ).length;
    const blockedAgents = agents.filter(
      (s) => s === "blocked" || s === "restricted",
    ).length;

    const score = computeArcScore(scan);

    return {
      brand,
      scan,
      openAgents,
      blockedAgents,
      totalAgents,
      score,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  type ScoredBrand = (typeof scored)[number];

  // Sort for leaderboards
  const aiReady: ScoredBrand[] = [...scored].sort((a, b) => b.score.total - a.score.total).slice(0, 10);
  const aiResistant: ScoredBrand[] = [...scored].sort((a, b) => a.score.total - b.score.total).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            AI-Ready Leaderboard
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Which brands are most open to AI shopping agents, and which are
            actively blocking them? Ranked by a composite of agent access
            openness and machine-readable signal coverage. Updated daily.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI-Ready */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-black text-foreground uppercase tracking-wider">
                Top 10 AI-Ready
              </h2>
            </div>
            <div className="space-y-2">
              {aiReady.map((entry, i) => (
                <Link
                  key={entry.brand.slug}
                  href={`/brand/${entry.brand.slug}`}
                  className="flex items-center gap-4 px-4 py-3 bg-white border-2 border-gray-200 hover:border-[#059669] transition-colors group"
                >
                  <span className="text-2xl font-black text-emerald-500 data-num w-8 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm text-foreground group-hover:text-[#059669] transition-colors block truncate">
                      {entry.brand.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.openAgents}/{entry.totalAgents} agents open
                      {" "}
                      &middot; data {entry.score.structuredData}/25 &middot; protocols {entry.score.protocolFiles}/15
                    </span>
                  </div>
                  <span className="text-xl font-black font-mono text-emerald-600 tabular-nums" title="ARC Score v1.0">
                    {entry.score.total}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* AI-Resistant */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <h2 className="text-lg font-black text-foreground uppercase tracking-wider">
                Top 10 AI-Resistant
              </h2>
            </div>
            <div className="space-y-2">
              {aiResistant.map((entry, i) => (
                <Link
                  key={entry.brand.slug}
                  href={`/brand/${entry.brand.slug}`}
                  className="flex items-center gap-4 px-4 py-3 bg-white border-2 border-gray-200 hover:border-red-500 transition-colors group"
                >
                  <span className="text-2xl font-black text-red-500 data-num w-8 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm text-foreground group-hover:text-red-500 transition-colors block truncate">
                      {entry.brand.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.blockedAgents}/{entry.totalAgents} agents blocked
                      {" "}
                      &middot; data {entry.score.structuredData}/25 &middot; protocols {entry.score.protocolFiles}/15
                    </span>
                  </div>
                  <span className="text-xl font-black font-mono text-red-500 tabular-nums" title="ARC Score v1.0">
                    {entry.score.total}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 max-w-lg mx-auto">
          <EmailCapture
            source="leaderboard"
            heading="Get the weekly leaderboard update"
            subtext="See which brands move up or down the rankings every week."
          />
        </div>

        <div className="mt-8 border-2 border-dashed border-gray-300 bg-gray-50/50 px-6 py-8 text-center max-w-lg mx-auto">
          <p className="text-sm font-semibold text-foreground mb-1">
            Track ranking changes for your brands
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Pro subscribers get daily alerts when tracked brands move up or down the rankings.
          </p>
          <Link
            href="/pro"
            className="inline-block text-sm font-bold text-white bg-[#FF6648] hover:bg-[#e85a3f] px-5 py-2 transition-colors"
          >
            {`Get Pro — $${PRO_PRICE_MONTHLY}/mo`}
          </Link>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            Rankings use ARC Score v1.0: agent access breadth (50) + structured
            data (25) + protocol files (15) + scan stability (10), computed from
            daily scans. Formula: <Link href="/methodology#score" className="text-[#0259DD] hover:underline">/methodology</Link>.
            {" "}
            <Link href="/matrix" className="text-[#0259DD] hover:underline">
              See the full matrix
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
