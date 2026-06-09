import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { buildWeeklyDigest, getArchiveWeeks, isMonday, mondayOf } from "@/lib/weekly";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function generateStaticParams() {
  return getArchiveWeeks().map((date) => ({ date }));
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  if (!DATE_RE.test(date)) return { title: "Weekly Digest — ARC Report" };
  const title = `Week of ${date} — Agent Access Digest | ARC Report`;
  const description = `Confirmed AI agent access changes across 1,000+ e-commerce brands in the week of ${date}: biggest blocks, biggest opens, llms.txt adopters, and platform shifts.`;
  const og = `${SITE_URL}/api/og?title=${encodeURIComponent(`Week of ${date}`)}&subtitle=${encodeURIComponent("Agent access digest — what moved across the index")}`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/weekly/${date}` },
    openGraph: { title, description, url: `${SITE_URL}/weekly/${date}`, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

function ChangeList({ title, items, empty }: {
  title: string;
  items: Array<{ id: number; brandSlug: string; brandName: string; field: string; oldValue: string | null; newValue: string | null; detectedAt: string }>;
  empty: string;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-black text-foreground tracking-tight mb-3">{title}</h2>
      {items.length === 0 ? (
        <div className="border border-gray-200 bg-white px-4 py-4 text-sm text-muted-foreground">{empty}</div>
      ) : (
        <div className="border border-gray-200 bg-white divide-y divide-gray-100">
          {items.map((c) => (
            <div key={c.id} className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
              <span className="font-mono text-xs text-muted-foreground shrink-0 w-12">{c.detectedAt.slice(5, 10)}</span>
              <Link href={`/brand/${c.brandSlug}`} className="font-semibold text-foreground hover:text-[#0259DD] shrink-0 w-36 truncate">
                {c.brandName}
              </Link>
              <span className="font-mono text-xs flex-1 min-w-0">
                <span className="text-muted-foreground">{c.field}: </span>
                <span className="text-[#DC2626]">{c.oldValue ?? "—"}</span>
                <span className="text-muted-foreground"> → </span>
                <span className="text-[#059669]">{c.newValue ?? "—"}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function WeeklyDigestPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) notFound();
  if (!isMonday(date)) redirect(`/weekly/${mondayOf(date)}`);

  const digest = buildWeeklyDigest(date);
  const weeks = getArchiveWeeks();
  const idx = weeks.indexOf(date);
  const newer = idx > 0 ? weeks[idx - 1] : null;
  const older = idx >= 0 && idx < weeks.length - 1 ? weeks[idx + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <div className="spec-label text-muted-foreground mb-2">
            WEEKLY DIGEST · <Link href="/weekly" className="hover:text-[#0259DD]">ARCHIVE</Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            Week of {digest.weekStart}
          </h1>
          <div className="flex items-center gap-6 text-sm">
            <span><span className="font-mono font-black text-xl text-foreground">{digest.totalChanges}</span><span className="text-muted-foreground ml-2">confirmed changes</span></span>
            <span><span className="font-mono font-black text-xl text-foreground">{digest.brandsMoving}</span><span className="text-muted-foreground ml-2">brands moving</span></span>
          </div>
        </div>

        {/* Auto-generated prose summary */}
        <div className="border-l-2 border-[#0259DD] pl-4 mb-10 space-y-3">
          {digest.prose.map((p, i) => (
            <p key={i} className="text-base text-foreground leading-relaxed">{p}</p>
          ))}
        </div>

        <ChangeList title="Biggest blocks" items={digest.blocks} empty="No agents were newly blocked or restricted this week." />
        <ChangeList title="Biggest opens" items={digest.opens} empty="No previously blocked agents were opened this week." />
        <ChangeList title="New llms.txt adopters" items={digest.llmsAdopters} empty="No new llms.txt files detected this week." />
        <ChangeList title="Platform & infrastructure shifts" items={digest.platformShifts} empty="No platform, CDN, or WAF changes this week." />

        {digest.topMovers.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-black text-foreground tracking-tight mb-3">Top movers</h2>
            <div className="border border-gray-200 bg-white divide-y divide-gray-100">
              {digest.topMovers.map((m, i) => (
                <div key={m.brandSlug} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="font-mono text-xs text-muted-foreground w-6">#{i + 1}</span>
                  <Link href={`/brand/${m.brandSlug}`} className="font-semibold text-foreground hover:text-[#0259DD] flex-1">
                    {m.brandName}
                  </Link>
                  <span className="font-mono font-bold text-[#FF6648]">{m.changeCount}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <nav className="flex items-center justify-between border-t border-gray-200 pt-5 text-sm">
          {older ? (
            <Link href={`/weekly/${older}`} className="text-[#0259DD] hover:underline">← Week of {older}</Link>
          ) : <span />}
          {newer ? (
            <Link href={`/weekly/${newer}`} className="text-[#0259DD] hover:underline">Week of {newer} →</Link>
          ) : (
            <Link href="/weekly" className="text-[#0259DD] hover:underline">Current week →</Link>
          )}
        </nav>
      </main>
      <Footer />
    </div>
  );
}
