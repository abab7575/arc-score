import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { EmailCapture } from "@/components/shared/email-capture";
import { getMatrixData } from "@/lib/db/queries";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI-Ready Leaderboard — ARC Report",
  description:
    "Which brands are most open to AI shopping agents, and which are blocking them? Updated daily from 1,000+ brand scans.",
};

export default function LeaderboardPage() {
  const matrix = getMatrixData().filter((entry) => entry.scan !== null);

  // Score each brand: openness = allowed agents / total agents, weighted by machine-readable signals
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

    const signalCount = [
      scan.hasJsonLd,
      scan.hasSchemaProduct,
      scan.hasOpenGraph,
      scan.hasSitemap,
      scan.hasProductFeed,
      scan.hasLlmsTxt,
      scan.hasAgentsTxt,
      scan.hasUcp,
    ].filter(Boolean).length;

    // Composite score: 70% agent openness + 30% signal coverage
    const opennessScore = openAgents / totalAgents;
    const signalScore = signalCount / 8;
    const composite = opennessScore * 0.7 + signalScore * 0.3;

    return {
      brand,
      scan,
      openAgents,
      blockedAgents,
      totalAgents,
      signalCount,
      composite,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  type ScoredBrand = (typeof scored)[number];

  // Sort for leaderboards
  const aiReady: ScoredBrand[] = [...scored].sort((a, b) => b.composite - a.composite).slice(0, 10);
  const aiResistant: ScoredBrand[] = [...scored].sort((a, b) => a.composite - b.composite).slice(0, 10);

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
                      &middot; {entry.signalCount}/8 signals
                    </span>
                  </div>
                  <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.round(entry.composite * 100)}%` }}
                    />
                  </div>
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
                      &middot; {entry.signalCount}/8 signals
                    </span>
                  </div>
                  <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: `${Math.round((1 - entry.composite) * 100)}%` }}
                    />
                  </div>
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

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            Rankings are based on daily HTTP scans of 1,000+ brands.
            Composite score: 70% agent access openness + 30% machine-readable signal coverage.
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
