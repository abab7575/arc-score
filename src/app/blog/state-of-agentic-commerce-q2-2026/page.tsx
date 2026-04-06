import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { EmailCapture } from "@/components/shared/email-capture";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "State of Agentic Commerce — Q2 2026 | ARC Report",
  description:
    "Our first quarterly report on how 1,000+ e-commerce brands are responding to AI shopping agents. 96% are open, 4% are blocking, and llms.txt adoption just crossed 10%.",
  openGraph: {
    title: "State of Agentic Commerce — Q2 2026",
    description:
      "1,006 brands scanned daily. 96% open to AI agents. Who's blocking, who's preparing, and what it means.",
    type: "article",
    publishedTime: "2026-04-06T00:00:00Z",
    authors: ["ARC Report"],
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   Q2 2026 REPORT — STATE OF AGENTIC COMMERCE
   ═══════════════════════════════════════════════════════════════════════ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="spec-label text-[#0259DD] mb-3 mt-16">{children}</div>
  );
}

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="border-2 border-gray-200 bg-white px-5 py-4">
      <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function CategoryRow({
  category,
  blocking,
  total,
  pct,
  note,
}: {
  category: string;
  blocking: number;
  total: number;
  pct: string;
  note: string;
}) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-32 shrink-0">
        <span className="text-sm font-semibold text-foreground">{category}</span>
      </div>
      <div className="w-24 shrink-0 text-right">
        <span className="font-mono text-sm text-foreground">
          {blocking}/{total}
        </span>
        <span className="text-xs text-muted-foreground ml-1">({pct})</span>
      </div>
      <div className="text-sm text-muted-foreground">{note}</div>
    </div>
  );
}

export default function Q2ReportPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* ── HEADER ──────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="spec-label text-muted-foreground">APR 2026</span>
            <span className="w-1 h-1 rounded-full bg-[#FF6648]" />
            <span className="spec-label text-[#0259DD]">QUARTERLY REPORT</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-4">
            State of Agentic Commerce — Q2 2026
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Three months ago, we started scanning 1,006 e-commerce brands daily
            to answer a simple question: are online stores ready for AI shopping
            agents? This is our first quarterly report. The short answer is that
            most brands are wide open, a small but important minority are
            actively blocking, and a new standard called{" "}
            <span className="font-mono text-foreground">llms.txt</span> is
            quietly gaining traction faster than anyone expected.
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="flex h-[3px] mb-10">
          <div className="flex-1 bg-[#FF6648]" />
          <div className="flex-1 bg-[#FBBA16]" />
          <div className="flex-1 bg-[#0259DD]" />
          <div className="flex-1 bg-[#84AFFB]" />
        </div>

        {/* ── KEY FINDINGS ────────────────────────────────────────── */}
        <SectionLabel>01 — KEY FINDINGS</SectionLabel>
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-6">
          The numbers at a glance
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <StatCard value="1,006" label="Brands scanned daily" />
          <StatCard value="96%" label="Fully open to AI agents" />
          <StatCard value="~4%" label="Blocking at least one agent" />
          <StatCard value="~10%" label="Have published llms.txt" />
          <StatCard value="36" label="Brands actively blocking" />
          <StatCard value="8" label="AI agents tracked" />
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          Of the 1,006 brands in our index, 970 allow every major AI
          agent&mdash;GPTBot, ChatGPT-User, ClaudeBot, Claude-Web,
          PerplexityBot, Amazonbot, Google-Extended, and Bytespider&mdash;full
          access through their{" "}
          <span className="font-mono text-foreground">robots.txt</span>. The
          remaining 36 brands block or restrict at least one agent, typically
          through explicit disallow rules or WAF-level challenges.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This does not mean 96% of brands are strategically prepared for AI
          agents. It means they have not yet taken a position. The absence of a
          block is not the same as a strategy.
        </p>

        {/* ── WHO'S BLOCKING AND WHY ─────────────────────────────── */}
        <SectionLabel>02 — WHO&apos;S BLOCKING AND WHY</SectionLabel>
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-4">
          Category breakdown
        </h2>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Blocking is not evenly distributed. Certain categories have
          disproportionately high block rates, usually tied to content
          sensitivity, competitive intelligence concerns, or legacy security
          postures that predate the current AI agent wave.
        </p>

        <div className="border-2 border-gray-200 bg-white px-5 py-4 mb-6">
          <div className="spec-label text-muted-foreground mb-3">
            BLOCK RATE BY CATEGORY
          </div>
          <CategoryRow
            category="Automotive"
            blocking={6}
            total={34}
            pct="18%"
            note="Highest block rate. Dealer networks and inventory systems drive aggressive WAF rules."
          />
          <CategoryRow
            category="Luxury"
            blocking={5}
            total={48}
            pct="10%"
            note="Brand protection instinct. Several luxury houses block all crawlers except Googlebot."
          />
          <CategoryRow
            category="Electronics"
            blocking={4}
            total={62}
            pct="6%"
            note="Price-sensitive verticals. Blocking appears correlated with dynamic pricing strategies."
          />
          <CategoryRow
            category="Fashion"
            blocking={8}
            total={210}
            pct="4%"
            note="Largest category. Blocks cluster among brands with aggressive anti-scraping WAFs."
          />
          <CategoryRow
            category="Grocery"
            blocking={3}
            total={52}
            pct="6%"
            note="Regional grocers block more than nationals. Likely inherited IT security policies."
          />
          <CategoryRow
            category="All others"
            blocking={10}
            total={600}
            pct="~2%"
            note="Home, beauty, sports, DTC — minimal blocking. Most have no explicit AI agent policy."
          />
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          An important nuance: many blocks we detect are not intentional
          AI-agent policy decisions. They are side effects of WAF
          configurations&mdash;Akamai, Cloudflare, and PerimeterX rules that
          challenge or reject non-browser user agents. The brand&apos;s{" "}
          <span className="font-mono text-foreground">robots.txt</span> may say
          &ldquo;allowed&rdquo; while the infrastructure says
          &ldquo;blocked.&rdquo; We track both layers.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Automotive stands out at 18%. Dealer management platforms (CDK Global,
          Reynolds and Reynolds) ship default configurations that block
          non-standard user agents. Most dealership websites inherit these
          settings without deliberate choice. As AI shopping agents become a real
          acquisition channel for auto purchases, this will create friction.
        </p>

        {/* ── LLMS.TXT ADOPTION ──────────────────────────────────── */}
        <SectionLabel>03 — THE LLMS.TXT ADOPTION CURVE</SectionLabel>
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-4">
          A new standard, moving fast
        </h2>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          <span className="font-mono text-foreground">llms.txt</span> is a
          proposed standard that lets websites communicate directly with large
          language models&mdash;describing what the site does, what content is
          available, and how an LLM should interact with it. Think of it as a
          cover letter for AI agents, sitting alongside{" "}
          <span className="font-mono text-foreground">robots.txt</span> but
          designed for a fundamentally different reader.
        </p>

        <div className="border-l-2 border-[#FF6648] pl-4 mb-6">
          <p className="text-sm text-foreground font-semibold mb-1">
            ~10% adoption in under three months
          </p>
          <p className="text-sm text-muted-foreground">
            Roughly 100 of the 1,006 brands in our index now serve a valid{" "}
            <span className="font-mono">llms.txt</span> file. For a standard
            with no browser requirement and no SEO incentive, this is
            remarkably fast.
          </p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          Adoption is led by Shopify brands. Shopify&apos;s app ecosystem has
          made it trivial to publish an{" "}
          <span className="font-mono text-foreground">llms.txt</span> file, and
          the DTC brands on Shopify tend to be early adopters of new web
          standards. Fashion and beauty brands over-index on adoption. Luxury
          brands, ironically, are both the most likely to block agents and the
          least likely to publish{" "}
          <span className="font-mono text-foreground">llms.txt</span>.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          The quality of published files varies enormously. Some are
          comprehensive, multi-section documents with product taxonomy
          descriptions and explicit agent permissions. Others are a single line.
          We are beginning to track{" "}
          <span className="font-mono text-foreground">llms.txt</span> depth as
          a signal, and plan to publish a quality index in Q3.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If adoption continues at the current pace, we project 25&ndash;30% of
          the index will have{" "}
          <span className="font-mono text-foreground">llms.txt</span> by Q4
          2026. The inflection point will be platform-level defaults. When
          Shopify or BigCommerce generates{" "}
          <span className="font-mono text-foreground">llms.txt</span>{" "}
          automatically for new stores, the curve goes vertical.
        </p>

        {/* ── WHAT THIS MEANS FOR BRANDS ─────────────────────────── */}
        <SectionLabel>04 — WHAT THIS MEANS FOR BRANDS</SectionLabel>
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-4">
          Strategic implications
        </h2>

        <div className="space-y-4 mb-6">
          <div className="border-l-2 border-[#FBBA16] pl-4">
            <p className="text-sm font-semibold text-foreground mb-1">
              Silence is a position, but it won&apos;t stay neutral
            </p>
            <p className="text-sm text-muted-foreground">
              96% of brands have no explicit AI agent policy. Today, that means
              they are open by default. But as agent traffic grows and becomes
              attributable, regulators and consumers will start asking whether
              &ldquo;open by omission&rdquo; was a deliberate choice. Brands
              should document their position before it is documented for them.
            </p>
          </div>

          <div className="border-l-2 border-[#FBBA16] pl-4">
            <p className="text-sm font-semibold text-foreground mb-1">
              Your WAF may be making decisions you don&apos;t know about
            </p>
            <p className="text-sm text-muted-foreground">
              We see a recurring pattern: brands whose{" "}
              <span className="font-mono">robots.txt</span> allows an agent,
              but whose CDN or WAF blocks the request anyway. This creates a
              contradictory signal. If you are open to AI agents, verify that
              your infrastructure agrees.
            </p>
          </div>

          <div className="border-l-2 border-[#FBBA16] pl-4">
            <p className="text-sm font-semibold text-foreground mb-1">
              Structured data is your agent-facing storefront
            </p>
            <p className="text-sm text-muted-foreground">
              Agents do not browse visually. They parse JSON-LD, Schema.org
              Product markup, and Open Graph tags. Brands with strong structured
              data will be recommended more accurately by agents. Brands
              without it will be invisible or misrepresented.
            </p>
          </div>

          <div className="border-l-2 border-[#FBBA16] pl-4">
            <p className="text-sm font-semibold text-foreground mb-1">
              Publish llms.txt now&mdash;first-mover advantage is real
            </p>
            <p className="text-sm text-muted-foreground">
              At 10% adoption, brands that publish a comprehensive{" "}
              <span className="font-mono">llms.txt</span> today are shaping how
              AI agents understand their category. By the time adoption hits
              50%, the early publishers will have established the schema.
            </p>
          </div>
        </div>

        {/* ── WHAT THIS MEANS FOR AGENT BUILDERS ─────────────────── */}
        <SectionLabel>05 — WHAT THIS MEANS FOR AGENT BUILDERS</SectionLabel>
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-4">
          Practical implications
        </h2>

        <div className="space-y-4 mb-6">
          <div className="border-l-2 border-[#059669] pl-4">
            <p className="text-sm font-semibold text-foreground mb-1">
              Access is not the bottleneck&mdash;data quality is
            </p>
            <p className="text-sm text-muted-foreground">
              96% of sites are technically reachable. The real challenge is that
              product data quality varies wildly. JSON-LD coverage, feed
              freshness, and price accuracy are unreliable across large swaths
              of the index. Agents that can gracefully handle incomplete data
              will outperform those that assume clean inputs.
            </p>
          </div>

          <div className="border-l-2 border-[#059669] pl-4">
            <p className="text-sm font-semibold text-foreground mb-1">
              Respect the blocks
            </p>
            <p className="text-sm text-muted-foreground">
              The 4% that block are doing so intentionally (or at least
              their infrastructure is). Circumventing these blocks erodes the
              trust that keeps the other 96% open. The agent ecosystem is in a
              cooperative equilibrium right now. Breaking it would trigger a wave
              of preemptive blocking.
            </p>
          </div>

          <div className="border-l-2 border-[#059669] pl-4">
            <p className="text-sm font-semibold text-foreground mb-1">
              Check llms.txt first
            </p>
            <p className="text-sm text-muted-foreground">
              If a brand publishes{" "}
              <span className="font-mono">llms.txt</span>, it is an explicit
              signal that they want to communicate with your model. Read it.
              Follow its instructions. This is the emerging social contract
              between AI and commerce&mdash;agents that honor it will get better
              access and data over time.
            </p>
          </div>

          <div className="border-l-2 border-[#059669] pl-4">
            <p className="text-sm font-semibold text-foreground mb-1">
              Use our API to stay current
            </p>
            <p className="text-sm text-muted-foreground">
              Agent access policies change daily. We detected 127 signal changes
              in our most recent scan alone. The ARC Report{" "}
              <Link
                href="/docs"
                className="text-[#0259DD] hover:underline"
              >
                public API
              </Link>{" "}
              gives you real-time access to every brand&apos;s status&mdash;no
              auth required for read endpoints.
            </p>
          </div>
        </div>

        {/* ── METHODOLOGY ────────────────────────────────────────── */}
        <div className="border-t border-gray-200 pt-8 mt-12 mb-10">
          <div className="spec-label text-muted-foreground mb-3">
            METHODOLOGY
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            ARC Report scans 1,006 e-commerce brands daily using automated
            probes. For each brand, we check{" "}
            <span className="font-mono text-foreground">robots.txt</span>{" "}
            rules for 8 major AI agent user-agents, test actual HTTP responses
            to detect WAF-level blocks, catalog structured data signals
            (JSON-LD, Schema Product, Open Graph, product feeds), and check for
            the presence and content of{" "}
            <span className="font-mono text-foreground">llms.txt</span> files.
            Brands span 15 categories from fashion and electronics to grocery
            and automotive. The full methodology is available on request.
          </p>
        </div>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <EmailCapture
            source="q2-report"
            heading="Get the next quarterly report"
            subtext="We publish quarterly. Subscribe to get the Q3 report and weekly intelligence digests in your inbox."
          />

          <div className="border-2 border-gray-200 bg-white px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground mb-0.5">
                Need deeper data?
              </p>
              <p className="text-xs text-muted-foreground">
                Pro subscribers get historical trends, CSV exports, higher API
                limits, and category-level analytics.
              </p>
            </div>
            <Link
              href="/pricing"
              className="shrink-0 px-4 py-2 bg-[#0259DD] text-white text-sm font-semibold hover:bg-[#0259DD]/90 transition-colors"
            >
              View pricing
            </Link>
          </div>
        </div>

        {/* ── Back to blog ───────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to blog
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
