import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { CopyCitation } from "@/components/insights/copy-citation";
import { computeInsights } from "@/lib/insights";
import { TRACKED_AGENT_COUNT } from "@/lib/site";
import type { Metadata } from "next";

// Regenerates with each scan (hourly revalidation; data changes once daily).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Insights — AI Agent Access Statistics | ARC Report",
  description:
    "Auto-computed headline statistics from the latest daily scan: % of e-commerce brands blocking each AI agent, most-blocked agent, most-open category, platform breakdown, and week-over-week changes. Every stat is citable.",
};

function StatRow({
  anchor,
  stat,
  detail,
  date,
}: {
  anchor: string;
  stat: string;
  detail: string;
  date: string;
}) {
  return (
    <div id={anchor} className="scroll-mt-20 border border-gray-200 bg-white px-5 py-4 flex items-start justify-between gap-4">
      <div>
        <a href={`#${anchor}`} className="text-lg font-black text-foreground hover:text-[#0259DD] leading-snug">
          {stat}
        </a>
        <p className="text-sm text-muted-foreground mt-1">{detail}</p>
      </div>
      <div className="shrink-0 pt-1">
        <CopyCitation stat={stat} anchor={anchor} date={date} />
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const ins = computeInsights();
  const date = (ins.lastScanAt ?? ins.generatedAt).split("T")[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="spec-label text-muted-foreground mb-2">INSIGHTS · AUTO-COMPUTED FROM THE LATEST SCAN</div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            The state of agent access, today
          </h1>
          <p className="text-base text-muted-foreground">
            Every number below is computed from the latest scan of{" "}
            {ins.scannedBrands.toLocaleString()} brands and regenerates with each scan — nothing
            is hand-written. Each stat has a stable anchor and a ready-to-paste citation.
            Definitions: &quot;blocking&quot; counts robots.txt policy blocks <em>and</em> WAF
            restrictions; &quot;fully open&quot; means no agent blocked or restricted.
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            Scan date: {date} · Machine-readable: <a href="/insights.md" className="text-[#0259DD] hover:underline">/insights.md</a>
          </p>
        </div>

        <div className="space-y-3 mb-12">
          <StatRow
            anchor="fully-open"
            stat={`${ins.fullyOpenPercent}% of tracked e-commerce brands are fully open to all ${TRACKED_AGENT_COUNT} major AI agents`}
            detail={`${ins.fullyOpenCount} of ${ins.scannedBrands} scanned brands neither block nor restrict any tracked agent.`}
            date={date}
          />
          <StatRow
            anchor="blocking-any"
            stat={`${ins.blockingAnyCount} brands (${Math.round((ins.blockingAnyCount / Math.max(ins.scannedBrands, 1)) * 1000) / 10}%) block or restrict at least one AI agent`}
            detail="Includes robots.txt policy blocks and WAF/CDN-level restrictions."
            date={date}
          />
          {ins.mostBlockedAgent && (
            <StatRow
              anchor="most-blocked-agent"
              stat={`${ins.mostBlockedAgent.agent} is the most-blocked AI agent: ${ins.mostBlockedAgent.blockedPercent}% of brands block or restrict it`}
              detail={`${ins.mostBlockedAgent.blockedCount} robots.txt policy blocks + ${ins.mostBlockedAgent.restrictedCount} WAF restrictions across ${ins.scannedBrands} brands.`}
              date={date}
            />
          )}
          {ins.mostOpenCategory && (
            <StatRow
              anchor="most-open-category"
              stat={`${ins.mostOpenCategory.category} is the most AI-open category: ${ins.mostOpenCategory.fullyOpenPercent}% of brands fully open`}
              detail={`${ins.mostOpenCategory.fullyOpenCount} of ${ins.mostOpenCategory.brandCount} ${ins.mostOpenCategory.category} brands allow every tracked agent.`}
              date={date}
            />
          )}
          <StatRow
            anchor="llms-txt"
            stat={`${ins.llmsTxtPercent}% of brands publish llms.txt (${ins.llmsTxtCount} of ${ins.scannedBrands})`}
            detail="Presence of /llms.txt detected in the latest scan."
            date={date}
          />
          <StatRow
            anchor="weekly-changes"
            stat={`${ins.changesThisWeek} confirmed agent-access changes this week (vs ${ins.changesPreviousWeek} the week before)`}
            detail={`${ins.brandsMovingThisWeek} distinct brands changed at least one signal in the last 7 days.`}
            date={date}
          />
        </div>

        <section className="mb-12">
          <h2 id="per-agent" className="text-xl font-black text-foreground tracking-tight mb-4 scroll-mt-20">
            <a href="#per-agent" className="hover:text-[#0259DD]">Blocking rate per agent</a>
          </h2>
          <div className="border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-4 py-2.5 font-semibold">Agent</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Company</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Policy blocks</th>
                  <th className="text-right px-4 py-2.5 font-semibold">WAF restricted</th>
                  <th className="text-right px-4 py-2.5 font-semibold">% blocking</th>
                  <th className="text-right px-4 py-2.5 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {ins.agentStats.map((a) => (
                  <tr key={a.agent} id={`agent-${a.agent}`} className="border-b border-gray-100 last:border-0 scroll-mt-20">
                    <td className="px-4 py-2 font-mono text-xs">{a.agent}</td>
                    <td className="px-4 py-2 text-muted-foreground">{a.company}</td>
                    <td className="px-4 py-2 text-right font-mono">{a.blockedCount}</td>
                    <td className="px-4 py-2 text-right font-mono">{a.restrictedCount}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold">{a.blockedPercent}%</td>
                    <td className="px-4 py-2 text-right">
                      <CopyCitation
                        stat={`${a.blockedPercent}% of tracked e-commerce brands block or restrict ${a.agent}`}
                        anchor={`agent-${a.agent}`}
                        date={date}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 id="categories" className="text-xl font-black text-foreground tracking-tight mb-4 scroll-mt-20">
            <a href="#categories" className="hover:text-[#0259DD]">Openness by category</a>
          </h2>
          <div className="border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-4 py-2.5 font-semibold">Category</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Brands</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Fully open</th>
                  <th className="text-right px-4 py-2.5 font-semibold">% fully open</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Avg agents blocked</th>
                </tr>
              </thead>
              <tbody>
                {ins.categoryStats.map((c) => (
                  <tr key={c.category} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2">{c.category}</td>
                    <td className="px-4 py-2 text-right font-mono">{c.brandCount}</td>
                    <td className="px-4 py-2 text-right font-mono">{c.fullyOpenCount}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold">{c.fullyOpenPercent}%</td>
                    <td className="px-4 py-2 text-right font-mono">{c.avgBlockedAgents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 id="platforms" className="text-xl font-black text-foreground tracking-tight mb-4 scroll-mt-20">
            <a href="#platforms" className="hover:text-[#0259DD]">Platform breakdown</a>
          </h2>
          <div className="border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-4 py-2.5 font-semibold">Platform</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Brands</th>
                  <th className="text-right px-4 py-2.5 font-semibold">% of index</th>
                </tr>
              </thead>
              <tbody>
                {ins.platformStats.map((p) => (
                  <tr key={p.platform} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{p.platform}</td>
                    <td className="px-4 py-2 text-right font-mono">{p.brandCount}</td>
                    <td className="px-4 py-2 text-right font-mono">{p.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          Citation format: &quot;stat — ARC Report, {date}, arcreport.ai/insights#anchor&quot;.
          Data is CC BY 4.0 (<Link href="/data" className="text-[#0259DD] hover:underline">download</Link>).
          Methods: <Link href="/methodology" className="text-[#0259DD] hover:underline">/methodology</Link>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
