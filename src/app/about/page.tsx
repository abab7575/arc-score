import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Globe, Database, Eye } from "lucide-react";
import { CATEGORY_CONFIG, GRADE_THRESHOLDS } from "@/lib/constants";
import type { CategoryId } from "@/types/report";

export const metadata = {
  title: "About — ARC Score",
  description: "How ARC Score measures agent readiness for e-commerce sites. Methodology, scoring categories, agent types, and grading scale.",
};

const agents = [
  {
    icon: Globe,
    name: "Browser Agent",
    description: "Navigates your site like a real customer's personal agent — clicking links, filling forms, interacting with the DOM. Uses Puppeteer with stealth mode.",
    tests: ["Homepage navigation", "Product discovery", "Variant selection", "Add to cart", "Checkout flow", "Cookie consent handling"],
    color: "text-[#0259DD]",
    bg: "bg-[#0259DD]/10",
  },
  {
    icon: Database,
    name: "Data Agent",
    description: "Reads structured data, APIs, and feeds to understand your product catalog without rendering pages.",
    tests: ["Schema.org Product markup", "JSON-LD parsing", "Open Graph tags", "robots.txt analysis", "Sitemap detection", "API endpoint probing", "/.well-known/ucp", "/llms.txt"],
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    icon: Eye,
    name: "Accessibility Agent",
    description: "Uses the accessibility tree and ARIA labels to interact with your site without visual rendering.",
    tests: ["Landmark analysis", "Heading structure", "Interactive element labeling", "Keyboard navigation", "Focus trap detection"],
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
];

const categories = Object.entries(CATEGORY_CONFIG) as [CategoryId, typeof CATEGORY_CONFIG[CategoryId]][];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          How ARC Score Works
        </h1>
        <p className="text-sm text-muted-foreground mb-10 max-w-xl">
          ARC Score measures how well e-commerce sites support AI agent interactions. We send three specialized agents to test the full shopping journey — from product discovery to checkout.
        </p>

        {/* Scoring Categories */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            6 Scoring Categories
          </h2>
          <div className="space-y-3">
            {categories.map(([id, config]) => (
              <div key={id} className="card-soft rounded-lg p-4 flex items-start gap-4">
                <div className="shrink-0 w-12 text-center">
                  <span className="data-num text-lg font-bold text-[#0259DD]">
                    {Math.round(config.weight * 100)}%
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{config.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Agent Types */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            3 Agent Types
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {agents.map((agent) => (
              <div key={agent.name} className="card-soft rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg ${agent.bg} flex items-center justify-center`}>
                    <agent.icon size={18} className={agent.color} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{agent.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.tests.map((test) => (
                    <span key={test} className="px-2 py-0.5 bg-gray-50 rounded text-[10px] text-muted-foreground">
                      {test}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Grading Scale */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Grading Scale
          </h2>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Grade</th>
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Score Range</th>
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Label</th>
                </tr>
              </thead>
              <tbody>
                {GRADE_THRESHOLDS.map((g, i) => {
                  const next = GRADE_THRESHOLDS[i - 1];
                  const range = next ? `${g.min}–${next.min - 1}` : `${g.min}+`;
                  return (
                    <tr key={g.grade} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3">
                        <span className="data-num text-lg font-bold" style={{ color: g.color }}>{g.grade}</span>
                      </td>
                      <td className="px-4 py-3 data-num text-sm text-foreground">{range}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{g.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Frequency */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Scanning Frequency
          </h2>
          <p className="text-sm text-muted-foreground">
            We scan all tracked brands daily. Scores are updated automatically and historical trends are preserved for 30 days. Want your brand added? Visit the <a href="/submit" className="text-[#0259DD] hover:underline">submit page</a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
