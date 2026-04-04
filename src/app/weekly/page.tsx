import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import {
  getTopMovers,
  getChangelogByFieldPattern,
  getWeeklyTotals,
} from "@/lib/db/queries";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Weekly Intelligence — ARC Report",
  description:
    "What moved this week in agentic commerce: top-changing brands, new llms.txt adopters, new agent declaration files, newly restricted agents, and platform shifts.",
};

const WINDOW_DAYS = 7;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtValue(v: string | null | undefined) {
  if (v === null || v === undefined || v === "") return "—";
  return v;
}

function Section({
  title,
  count,
  description,
  children,
}: {
  title: string;
  count: number;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
          {title}
        </h2>
        <span className="text-xs font-mono text-muted-foreground shrink-0">
          {count} {count === 1 ? "entry" : "entries"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {count === 0 ? (
        <div className="border-2 border-gray-200 bg-white px-4 py-6 text-sm text-muted-foreground text-center">
          No changes in the last {WINDOW_DAYS} days.
        </div>
      ) : (
        <div className="border-2 border-gray-200 bg-white">{children}</div>
      )}
    </section>
  );
}

type ChangelogRow = {
  id: number;
  brandSlug: string;
  brandName: string;
  brandCategory: string | null;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  detectedAt: string;
};

function ChangeRow({ entry }: { entry: ChangelogRow }) {
  return (
    <div className="flex items-baseline gap-3 px-4 py-3 border-b border-gray-200 last:border-b-0">
      <span className="text-xs font-mono text-muted-foreground shrink-0 w-14">
        {fmtDate(entry.detectedAt)}
      </span>
      <Link
        href={`/brand/${entry.brandSlug}`}
        className="text-sm font-semibold text-foreground hover:text-[#0259DD] shrink-0 w-36 truncate"
      >
        {entry.brandName}
      </Link>
      <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline w-20 truncate">
        {entry.brandCategory ?? "—"}
      </span>
      <span className="text-xs font-mono text-foreground flex-1 min-w-0">
        <span className="text-muted-foreground">{entry.field}:</span>{" "}
        <span className="text-[#DC2626]">{fmtValue(entry.oldValue)}</span>
        <span className="text-muted-foreground"> → </span>
        <span className="text-[#059669]">{fmtValue(entry.newValue)}</span>
      </span>
    </div>
  );
}

export default async function WeeklyPage() {
  const totals = getWeeklyTotals(WINDOW_DAYS);
  const topMovers = getTopMovers(WINDOW_DAYS, 15);

  const llmsAdopters = getChangelogByFieldPattern("llms_txt", WINDOW_DAYS, 30, "true");
  const agentDeclAdopters = getChangelogByFieldPattern("agents_txt", WINDOW_DAYS, 30, "true");
  const newlyRestricted = [
    ...getChangelogByFieldPattern("%robots.txt%", WINDOW_DAYS, 30, "blocked"),
    ...getChangelogByFieldPattern("%robots.txt%", WINDOW_DAYS, 30, "restricted"),
  ].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)).slice(0, 20);

  const infraShifts = [
    ...getChangelogByFieldPattern("platform", WINDOW_DAYS, 15),
    ...getChangelogByFieldPattern("cdn", WINDOW_DAYS, 15),
    ...getChangelogByFieldPattern("waf", WINDOW_DAYS, 15),
  ].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)).slice(0, 20);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="spec-label text-muted-foreground mb-2">
            WEEKLY INTELLIGENCE · {WINDOW_DAYS}-DAY WINDOW
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            What moved this week in agentic commerce
          </h1>
          <p className="text-base text-muted-foreground">
            Top-changing brands, new machine-readable signals published, and
            agent-access shifts across the index.
          </p>

          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-200 text-sm">
            <div>
              <span className="data-num text-2xl font-black text-foreground">
                {totals.totalChanges}
              </span>
              <span className="text-muted-foreground ml-2">total changes</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div>
              <span className="data-num text-2xl font-black text-foreground">
                {totals.brandsMoving}
              </span>
              <span className="text-muted-foreground ml-2">brands moving</span>
            </div>
          </div>
        </div>

        <Section
          title="Top Movers"
          count={topMovers.length}
          description={`Brands with the most confirmed signal changes in the last ${WINDOW_DAYS} days.`}
        >
          {topMovers.map((m, i) => (
            <div
              key={m.brandId}
              className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 last:border-b-0"
            >
              <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">
                #{i + 1}
              </span>
              <Link
                href={`/brand/${m.brandSlug}`}
                className="text-sm font-semibold text-foreground hover:text-[#0259DD] flex-1 min-w-0 truncate"
              >
                {m.brandName}
              </Link>
              <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                {m.brandCategory ?? "—"}
              </span>
              <span className="text-sm font-mono font-bold text-[#FF6648] shrink-0 w-12 text-right">
                {m.changeCount}
              </span>
            </div>
          ))}
        </Section>

        <Section
          title="New llms.txt Adopters"
          count={llmsAdopters.length}
          description="Brands that began publishing llms.txt this week."
        >
          {llmsAdopters.map((e) => (
            <ChangeRow key={e.id} entry={e} />
          ))}
        </Section>

        <Section
          title="New Agent Declaration Files"
          count={agentDeclAdopters.length}
          description="Brands that published an agent declaration file (/agents.txt, /agents-brief.txt, or /.well-known/agents.txt) this week. Naming is still unsettled; treat as a descriptive signal."
        >
          {agentDeclAdopters.map((e) => (
            <ChangeRow key={e.id} entry={e} />
          ))}
        </Section>

        <Section
          title="Newly Restricted Agents"
          count={newlyRestricted.length}
          description="robots.txt rules that started blocking or restricting specific AI agents this week."
        >
          {newlyRestricted.map((e) => (
            <ChangeRow key={e.id} entry={e} />
          ))}
        </Section>

        <Section
          title="Infrastructure Shifts"
          count={infraShifts.length}
          description="Brands that changed platform, CDN, or WAF this week."
        >
          {infraShifts.map((e) => (
            <ChangeRow key={e.id} entry={e} />
          ))}
        </Section>

        <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-muted-foreground">
          <p>
            All changes are observed via daily HTTP scans. Pro subscribers get
            full historical depth, CSV/JSON exports, and email alerts when
            specific brands or categories move.{" "}
            <Link href="/pricing" className="text-[#0259DD] hover:underline font-mono">
              See pricing →
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
