import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { CATEGORY_CONFIG, GRADE_THRESHOLDS } from "@/lib/constants";
import { AI_AGENT_PROFILES } from "@/lib/ai-agents";
import { getBrandBySlug, getLatestScanForBrand, getFullScanReport } from "@/lib/db/queries";
import { BRANDS } from "@/lib/brands";
import type { CategoryId } from "@/types/report";
import Link from "next/link";

export const metadata = {
  title: "Methodology — ARC Score",
  description:
    "How ARC Score measures AI agent readiness. Our scoring methodology, category weights, agent profiles, fail gates, and grading philosophy — fully transparent.",
};

export const dynamic = "force-dynamic";

// Grab a few real brand scores to use as inline examples
function getBrandExamples() {
  const slugs = ["nike", "amazon", "glossier", "bose", "allbirds", "warby-parker"];
  const examples: { name: string; slug: string; score: number; grade: string }[] = [];

  for (const slug of slugs) {
    const brand = getBrandBySlug(slug);
    if (!brand) continue;
    const scan = getLatestScanForBrand(brand.id);
    if (!scan) continue;
    const report = getFullScanReport(scan.id);
    if (!report) continue;
    examples.push({
      name: brand.name,
      slug: brand.slug,
      score: report.overallScore,
      grade: report.grade,
    });
    if (examples.length >= 4) break;
  }
  return examples;
}

function getBrandCategoryExamples() {
  const slugs = ["nike", "bose", "glossier", "allbirds", "bombas", "article"];
  const results: {
    name: string;
    slug: string;
    score: number;
    grade: string;
    categories: { id: string; name: string; score: number }[];
  }[] = [];

  for (const slug of slugs) {
    const brand = getBrandBySlug(slug);
    if (!brand) continue;
    const scan = getLatestScanForBrand(brand.id);
    if (!scan) continue;
    const report = getFullScanReport(scan.id);
    if (!report) continue;
    results.push({
      name: brand.name,
      slug: brand.slug,
      score: report.overallScore,
      grade: report.grade,
      categories: report.categories.map((c) => ({
        id: c.id,
        name: c.name,
        score: c.score,
      })),
    });
    if (results.length >= 3) break;
  }
  return results;
}

const categories = Object.entries(CATEGORY_CONFIG) as [
  CategoryId,
  (typeof CATEGORY_CONFIG)[CategoryId],
][];

const feedAgents = AI_AGENT_PROFILES.filter((a) => a.type === "feed");
const browserAgents = AI_AGENT_PROFILES.filter((a) => a.type === "browser");

export default function MethodologyPage() {
  const brandExamples = getBrandExamples();
  const categoryExamples = getBrandCategoryExamples();
  const totalBrands = BRANDS.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="mb-16">
          <span className="spec-label text-[#FF6648] inline-block px-2.5 py-1 rounded-sm mb-4" style={{ backgroundColor: "#FF664818" }}>
            Methodology
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
            How we score{" "}
            <span className="text-[#0259DD]">{totalBrands} brands</span> on AI
            agent readiness
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            We send real AI agents to shop on every site we track — browser
            agents that click, data agents that parse, accessibility agents that
            navigate by ARIA tree. Then we score what they find across 7
            weighted categories. No surveys, no self-reporting. Just what
            actually happens when an AI tries to buy something.
          </p>
        </div>

        {/* ── Live brand scores as proof ────────────────────────── */}
        {brandExamples.length > 0 && (
          <div className="mb-16">
            <div className="flex flex-wrap gap-3">
              {brandExamples.map((b) => {
                const threshold = GRADE_THRESHOLDS.find((g) => b.score >= g.min);
                return (
                  <Link
                    key={b.slug}
                    href={`/brand/${b.slug}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-[#0259DD]/30 hover:shadow-sm transition-all bg-white group"
                  >
                    <span
                      className="data-num text-xl font-bold"
                      style={{ color: threshold?.color }}
                    >
                      {b.score}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-foreground group-hover:text-[#0259DD] transition-colors">
                        {b.name}
                      </span>
                      <span
                        className="block text-[10px] font-medium"
                        style={{ color: threshold?.color }}
                      >
                        {threshold?.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Philosophy ───────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Scoring philosophy
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
                <span className="text-emerald-600 text-lg">&#10003;</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Weighted, not averaged
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cart &amp; Checkout is worth 25% because that&apos;s where
                revenue happens. Performance is 5% because fast-but-broken
                doesn&apos;t help. Weights reflect what matters to real agent
                commerce, not equal treatment.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center mb-3">
                <span className="text-red-500 text-lg font-bold">!</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Failures can&apos;t hide
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A perfect product page means nothing if agents can&apos;t
                check out. Scoring 100 on data standards doesn&apos;t
                compensate for a 10 on cart flow. Catastrophic weaknesses drag
                the overall score down — by design.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="w-9 h-9 rounded-lg bg-[#0259DD]/10 flex items-center justify-center mb-3">
                <span className="text-[#0259DD] text-lg">&#9881;</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                10 agents, 10 lenses
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The overall score uses our default weights. But each AI agent
                — ChatGPT Shopping, Amazon Buy For Me, Claude Computer Use —
                has its own weight profile. A site that&apos;s great for feed
                agents might fail browser agents.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                <span className="text-amber-600 text-lg">&#128269;</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Observable, not declared
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We don&apos;t ask brands to self-report. Our agents visit the
                live site, try to shop, and record what happens — screenshots,
                DOM state, structured data, response times. The score is based
                on what we observe, not what brands claim.
              </p>
            </div>
          </div>
        </section>

        {/* ── 7 Categories ─────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-foreground mb-2">
            7 scoring categories
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Every site is scored across these dimensions. Weights sum to 100%
            and reflect the relative importance to agent-driven commerce.
          </p>

          <div className="space-y-3">
            {categories.map(([id, config]) => (
              <div
                key={id}
                className="rounded-xl border border-gray-200 p-5 flex items-start gap-5"
              >
                {/* Weight bar */}
                <div className="shrink-0 w-16 text-center pt-0.5">
                  <span className="data-num text-2xl font-bold text-[#0259DD]">
                    {Math.round(config.weight * 100)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block -mt-1">
                    % weight
                  </span>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0259DD]"
                      style={{ width: `${config.weight * 400}%` }}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {config.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {config.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Live category breakdown examples */}
          {categoryExamples.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                How real brands break down
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {categoryExamples.map((b) => {
                  const threshold = GRADE_THRESHOLDS.find(
                    (g) => b.score >= g.min
                  );
                  return (
                    <Link
                      key={b.slug}
                      href={`/brand/${b.slug}`}
                      className="rounded-xl border border-gray-200 p-4 hover:border-[#0259DD]/30 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-foreground group-hover:text-[#0259DD] transition-colors">
                          {b.name}
                        </span>
                        <span
                          className="data-num text-lg font-bold"
                          style={{ color: threshold?.color }}
                        >
                          {b.score}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {b.categories.map((cat) => {
                          const catThreshold = GRADE_THRESHOLDS.find(
                            (g) => cat.score >= g.min
                          );
                          return (
                            <div key={cat.id} className="flex items-center gap-2">
                              <span className="text-[9px] text-muted-foreground w-24 truncate">
                                {cat.name}
                              </span>
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${cat.score}%`,
                                    backgroundColor:
                                      catThreshold?.color || "#d1d5db",
                                  }}
                                />
                              </div>
                              <span
                                className="data-num text-[10px] font-semibold w-6 text-right"
                                style={{ color: catThreshold?.color }}
                              >
                                {cat.score}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Grading Scale ────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-foreground mb-2">
            Grading scale
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Scores map to letter grades. Each grade has a named readiness level
            that tells you what the number means in practice.
          </p>

          <div className="grid grid-cols-5 gap-3">
            {GRADE_THRESHOLDS.map((g, i) => {
              const next = GRADE_THRESHOLDS[i - 1];
              const range = next ? `${g.min}–${next.min - 1}` : `${g.min}+`;
              return (
                <div
                  key={g.grade}
                  className="rounded-xl border border-gray-200 p-4 text-center"
                >
                  <span
                    className="data-num text-3xl font-black block mb-1"
                    style={{ color: g.color }}
                  >
                    {g.grade}
                  </span>
                  <span className="text-[10px] font-semibold text-foreground block">
                    {g.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground block mt-0.5 data-num">
                    {range}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 10 AI Agent Profiles ─────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-foreground mb-2">
            10 AI shopping agents
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Each agent has a different weight profile based on how it actually
            works. Feed agents care most about structured data. Browser agents
            care about clickable UI. A site can score 90 for one agent and 40
            for another.
          </p>

          {/* Feed agents */}
          <h3 className="spec-label text-[#0259DD] text-[10px] mb-3 px-2.5 py-1 rounded-sm inline-block" style={{ backgroundColor: "#0259DD18" }}>
            Feed &amp; API Agents
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Read structured data, product feeds, and APIs. Never open a
            browser.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {feedAgents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{agent.logo}</span>
                  <div>
                    <span className="text-sm font-semibold text-foreground block leading-tight">
                      {agent.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {agent.company}
                    </span>
                  </div>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-gray-50 text-[9px] text-muted-foreground font-medium">
                    {agent.adoptionLevel}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                  {agent.howItWorks}
                </p>
                {/* Weight profile mini-bar */}
                <div className="space-y-1">
                  {categories.slice(0, 4).map(([catId, catConfig]) => (
                    <div key={catId} className="flex items-center gap-1.5">
                      <span className="text-[8px] text-muted-foreground w-16 truncate">
                        {catConfig.name}
                      </span>
                      <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0259DD]/60"
                          style={{
                            width: `${(agent.weights[catId] / 0.3) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Browser agents */}
          <h3 className="spec-label text-[#FF6648] text-[10px] mb-3 px-2.5 py-1 rounded-sm inline-block" style={{ backgroundColor: "#FF664818" }}>
            Browser Automation Agents
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Open a real browser, click buttons, fill forms, navigate visually.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {browserAgents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{agent.logo}</span>
                  <div>
                    <span className="text-sm font-semibold text-foreground block leading-tight">
                      {agent.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {agent.company}
                    </span>
                  </div>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-gray-50 text-[9px] text-muted-foreground font-medium">
                    {agent.adoptionLevel}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                  {agent.howItWorks}
                </p>
                <div className="space-y-1">
                  {categories.slice(0, 4).map(([catId, catConfig]) => (
                    <div key={catId} className="flex items-center gap-1.5">
                      <span className="text-[8px] text-muted-foreground w-16 truncate">
                        {catConfig.name}
                      </span>
                      <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#FF6648]/60"
                          style={{
                            width: `${(agent.weights[catId] / 0.3) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How a scan works ─────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-foreground mb-2">
            How a scan works
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Every scan follows the same pipeline. No shortcuts, no sampling —
            every brand gets the full journey.
          </p>

          <div className="space-y-0">
            {[
              {
                step: "1",
                title: "Land on the homepage",
                desc: "Browser agent loads the site with realistic headers. Data agent fetches robots.txt, sitemap, and structured data. We check if the site blocks automated visitors.",
              },
              {
                step: "2",
                title: "Find a product",
                desc: "Browser agent navigates from homepage to a product page — via search, category links, or menu. We record every click and measure how many steps it takes.",
              },
              {
                step: "3",
                title: "Understand the product",
                desc: "Can the agent read the price, size options, availability, and images? We check both DOM elements and structured data markup.",
              },
              {
                step: "4",
                title: "Add to cart",
                desc: "The agent tries to select options and add to cart. This is where most sites start failing — unlabeled buttons, variant selectors that require visual understanding, dynamic overlays.",
              },
              {
                step: "5",
                title: "Attempt checkout",
                desc: "Navigate to cart, begin checkout flow. We don't complete purchases but test whether the agent can reach each step without getting stuck.",
              },
              {
                step: "6",
                title: "Score everything",
                desc: "Screenshots, DOM snapshots, structured data, timing, and accessibility tree state are analyzed. Each category gets a 0–100 score. Weights are applied. Grade is assigned.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="flex gap-5 py-5 border-b border-gray-100 last:border-0"
              >
                <span className="w-8 h-8 rounded-full bg-[#0259DD] text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {s.step}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Frequency + Coverage ──────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Coverage &amp; frequency
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 p-5 text-center">
              <span className="data-num text-3xl font-bold text-[#0259DD] block">
                {totalBrands}
              </span>
              <span className="text-xs text-muted-foreground">
                brands tracked
              </span>
            </div>
            <div className="rounded-xl border border-gray-200 p-5 text-center">
              <span className="data-num text-3xl font-bold text-[#0259DD] block">
                Daily
              </span>
              <span className="text-xs text-muted-foreground">
                scan frequency
              </span>
            </div>
            <div className="rounded-xl border border-gray-200 p-5 text-center">
              <span className="data-num text-3xl font-bold text-[#0259DD] block">
                30d
              </span>
              <span className="text-xs text-muted-foreground">
                trend history
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Want your brand added?{" "}
            <Link href="/submit" className="text-[#0259DD] hover:underline">
              Submit it here
            </Link>
            . We review submissions daily and add qualifying e-commerce sites
            to the index.
          </p>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-6">
            Common questions
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Why not just average all categories equally?",
                a: "Because a site that loads in 200ms but can't complete checkout is useless to an AI agent trying to buy something. Cart & Checkout gets 25% weight because that's where transactions happen. Equal weighting would let a fast, broken site score the same as a slower site that actually works.",
              },
              {
                q: "How is the per-agent score different from the overall score?",
                a: "The overall score uses our default category weights. Each AI agent has its own weight profile based on how it actually works. ChatGPT Shopping (a feed agent) cares heavily about structured data. Amazon Buy For Me (a browser agent) cares about clickable buttons and form fields. Same site, same categories, different weights = different scores.",
              },
              {
                q: "Do you actually visit the site, or just check metadata?",
                a: "Both. The browser agent loads the site in a real headless browser and tries to shop. The data agent checks structured markup, APIs, and feeds. The accessibility agent navigates via the ARIA tree. We test what agents actually do, not just what's technically present.",
              },
              {
                q: "Can a brand game the score?",
                a: "The best way to improve your score is to make your site work better for AI agents — which means better structured data, accessible UI, and functional checkout flows. These are the same things that improve SEO, accessibility, and conversion rates. There's no trick; just build a better site.",
              },
              {
                q: "How often do you update the methodology?",
                a: "As new AI shopping agents launch and existing ones evolve, we update our agent profiles and may adjust category weights. The core categories are stable. Weight changes are announced and applied going forward — historical scores aren't retroactively changed.",
              },
            ].map((faq) => (
              <div key={faq.q} className="border-b border-gray-100 pb-5 last:border-0">
                <h3 className="text-sm font-semibold text-foreground mb-1.5">
                  {faq.q}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
