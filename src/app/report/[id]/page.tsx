import { redirect, notFound } from "next/navigation";
import { getReport } from "@/lib/mock-data";
import { ReportHeader } from "@/components/report/report-header";
import { ScoreHero } from "@/components/report/score-hero";
import { ScoreBreakdown } from "@/components/report/score-breakdown";
import { AgentJourneys } from "@/components/report/agent-journeys";
import { FindingsSection } from "@/components/report/findings-section";
import { ActionPlan } from "@/components/report/action-plan";
import { WhatsNext } from "@/components/report/whats-next";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

// Map old report IDs to brand slugs
const REPORT_TO_BRAND: Record<string, string> = {
  "real-nike": "nike",
  "demo-nike": "nike",
  "demo-allbirds": "allbirds",
  "demo-amazon": "amazon",
};

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  // Redirect known report IDs to brand pages
  const brandSlug = REPORT_TO_BRAND[id];
  if (brandSlug) {
    redirect(`/brand/${brandSlug}`);
  }

  // Fallback: still try mock data for any remaining reports
  const report = getReport(id);
  if (!report) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <ReportHeader url={report.url} scannedAt={report.scannedAt} />
        <ScoreHero
          score={report.overallScore}
          grade={report.grade}
          verdict={report.verdict}
          comparison={report.comparison}
        />
        <ScoreBreakdown categories={report.categories} />
        <AgentJourneys journeys={report.journeys} siteName={report.url} />
        <FindingsSection findings={report.findings} />
        <ActionPlan
          actions={report.actionPlan}
          currentScore={report.overallScore}
          estimatedScoreAfterFixes={report.estimatedScoreAfterFixes}
        />
        <WhatsNext />
      </div>
      <Footer />
    </div>
  );
}
