import { notFound } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { BrandHeader } from "@/components/brand/brand-header";
import { ScoreTrendChart } from "@/components/brand/score-trend-chart";
import { ScanHistory } from "@/components/brand/scan-history";
import { ScoreHero } from "@/components/report/score-hero";
import { ScoreBreakdown } from "@/components/report/score-breakdown";
import { AgentJourneys } from "@/components/report/agent-journeys";
import { FindingsSection } from "@/components/report/findings-section";
import { ActionPlan } from "@/components/report/action-plan";
import { AgentCompatibility } from "@/components/report/agent-compatibility";
import { getBrandBySlug, getLatestScanForBrand, getFullScanReport, getScoreHistory, getAllScansForBrand } from "@/lib/db/queries";
import { BRANDS } from "@/lib/brands";
import type { Metadata } from "next";
import type { Grade } from "@/types/report";
import { getGradeLabel } from "@/lib/scoring";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BRANDS.map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) return { title: "Brand Not Found" };

  const latestScan = getLatestScanForBrand(brand.id);
  if (latestScan) {
    return {
      title: `${brand.name} ARC Score — ${latestScan.overallScore}/100 (Grade ${latestScan.grade})`,
      description: `${brand.name} scores ${latestScan.overallScore}/100 on the ARC Agent Readiness Index. Grade ${latestScan.grade}: ${getGradeLabel(latestScan.grade as Grade)}.`,
    };
  }

  return {
    title: `${brand.name} — ARC Score`,
    description: `Agent readiness score for ${brand.name}. See how well AI agents can navigate ${brand.url}.`,
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) notFound();

  const latestScan = getLatestScanForBrand(brand.id);
  const report = latestScan ? getFullScanReport(latestScan.id) : null;
  const history = getScoreHistory(brand.id, 30);
  const allScans = getAllScansForBrand(brand.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        <BrandHeader
          name={brand.name}
          url={brand.url}
          category={brand.category}
          scannedAt={latestScan?.scannedAt ?? null}
        />

        {report ? (
          <>
            <ScoreHero
              score={report.overallScore}
              grade={report.grade}
              verdict={report.verdict}
              comparison={report.comparison}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2">
                <ScoreTrendChart
                  data={history.map((h) => ({
                    date: h.date,
                    score: h.score,
                    grade: h.grade,
                  }))}
                />
              </div>
              <div>
                <ScanHistory scans={allScans} />
              </div>
            </div>

            <ScoreBreakdown categories={report.categories} />
            <AgentCompatibility scores={report.aiAgentScores} categories={report.categories} />
            <AgentJourneys journeys={report.journeys} siteName={report.url} />
            <FindingsSection findings={report.findings} />
            <ActionPlan
              actions={report.actionPlan}
              currentScore={report.overallScore}
              estimatedScoreAfterFixes={report.estimatedScoreAfterFixes}
            />
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-gray-300">?</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No scan data yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {brand.name} hasn&apos;t been scanned yet. Check back soon — we scan all tracked brands daily.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
