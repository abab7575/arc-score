import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { getIndexStats } from "@/lib/index-data";
import { CONTACT_EMAIL, TRACKED_AGENT_COUNT } from "@/lib/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About — ARC Report",
  description:
    "ARC Report is an independent, daily-updated public reference dataset for AI agent access in e-commerce. Who builds it, why, and how it stays honest.",
};

export default function AboutPage() {
  const stats = getIndexStats();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="spec-label text-muted-foreground mb-2">ABOUT</div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-6">
          A public record for the agentic web
        </h1>

        <div className="space-y-5 text-base text-muted-foreground leading-relaxed">
          <p>
            AI agents are becoming real commerce traffic, and the question of who lets them in —
            and who locks them out — is being decided quietly, one robots.txt line and one WAF
            rule at a time. Nobody was writing it down. ARC Report exists to be that record.
          </p>
          <p>
            Every day at 02:00 UTC we scan {stats.brandCount.toLocaleString()} e-commerce brands
            for {TRACKED_AGENT_COUNT} AI agents: robots.txt policy, live HTTP access tests,
            structured data, platform and WAF detection, and protocol files like llms.txt. The
            results are published in full — browsable pages, bulk downloads, a public API, and an
            MCP server — under CC BY 4.0.
          </p>

          <h2 className="text-lg font-black text-foreground pt-2">Independent</h2>
          <p>
            ARC Report is not affiliated with any AI lab, e-commerce platform, or bot-management
            vendor. No brand pays to be listed, removed, or re-scored. The quiet{" "}
            <Link href="/pro" className="text-[#0259DD] hover:underline">Pro tier</Link> (history
            depth and rate limits) funds the infrastructure; the dataset itself stays free.
          </p>

          <h2 className="text-lg font-black text-foreground pt-2">Daily</h2>
          <p>
            Web policy is volatile. A snapshot from last quarter is trivia; a daily series is
            evidence. Every page shows its last-scanned timestamp, and the{" "}
            <Link href="/changelog" className="text-[#0259DD] hover:underline">changelog</Link>{" "}
            records each confirmed change with before/after values.
          </p>

          <h2 className="text-lg font-black text-foreground pt-2">Verified</h2>
          <p>
            We separate what sites <em>declare</em> (robots.txt) from what they <em>enforce</em>{" "}
            (WAF behaviour), require inferred changes to appear in two consecutive scans before
            publishing, and run a public{" "}
            <Link href="/reliability" className="text-[#0259DD] hover:underline">corrections log and dispute process</Link>.
            The full method is on{" "}
            <Link href="/methodology" className="text-[#0259DD] hover:underline">/methodology</Link> —
            anyone can reproduce a scan with curl.
          </p>

          <h2 className="text-lg font-black text-foreground pt-2">Who builds it</h2>
          <p>
            ARC Report is built and run by Andy Bryn, an independent developer. It started as a
            tool to answer one question — &quot;can an AI agent actually buy from this store?&quot; —
            and turned into the dataset this site publishes. Questions, corrections, research
            collaborations:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0259DD] hover:underline">{CONTACT_EMAIL}</a>.
          </p>

          <div className="border-2 border-gray-200 bg-white px-5 py-4 text-sm mt-4">
            <p className="font-semibold text-foreground mb-2">Use the data</p>
            <ul className="space-y-1">
              <li>• <Link href="/data" className="text-[#0259DD] hover:underline">Download daily snapshots</Link> (JSON/CSV, CC BY 4.0)</li>
              <li>• <Link href="/docs" className="text-[#0259DD] hover:underline">Public API</Link> · <Link href="/docs/mcp" className="text-[#0259DD] hover:underline">MCP server</Link></li>
              <li>• <Link href="/insights" className="text-[#0259DD] hover:underline">Citable insights</Link> with copy-paste attribution</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
