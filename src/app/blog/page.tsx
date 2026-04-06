import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — ARC Report",
  description:
    "Research, analysis, and quarterly reports on how AI agents interact with e-commerce — from the team scanning 1,000+ brands daily.",
};

interface BlogEntry {
  slug: string;
  date: string;
  tag: string;
  title: string;
  summary: string;
}

const posts: BlogEntry[] = [
  {
    slug: "state-of-agentic-commerce-q2-2026",
    date: "APR 2026",
    tag: "QUARTERLY REPORT",
    title: "State of Agentic Commerce — Q2 2026",
    summary:
      "Our first quarterly report covering 1,000+ e-commerce brands: who's open, who's blocking, and what the llms.txt adoption curve looks like three months in.",
  },
];

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="spec-label text-muted-foreground mb-2">RESEARCH</div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            Blog
          </h1>
          <p className="text-base text-muted-foreground">
            Quarterly reports, deep dives, and analysis from the ARC Report
            intelligence pipeline.
          </p>
        </div>

        {/* Post list */}
        <div className="space-y-0 divide-y divide-gray-200 border-t border-gray-200">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block py-6 group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="spec-label text-muted-foreground">
                  {post.date}
                </span>
                <span className="w-1 h-1 rounded-full bg-[#FF6648]" />
                <span className="spec-label text-[#0259DD]">{post.tag}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight group-hover:text-[#0259DD] transition-colors mb-1">
                {post.title}
              </h2>
              <p className="text-sm text-muted-foreground">{post.summary}</p>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
