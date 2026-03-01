export type Grade = "A" | "B" | "C" | "D" | "F";
export type Severity = "critical" | "high" | "medium" | "low";
export type AgentType = "browser" | "data" | "accessibility";
export type TestResult = "pass" | "partial" | "fail";

export type CategoryId =
  | "discoverability"
  | "product-understanding"
  | "navigation-interaction"
  | "cart-checkout"
  | "performance-resilience"
  | "data-standards"
  | "agentic-commerce";

export interface CategoryScore {
  id: CategoryId;
  name: string;
  weight: number;
  score: number;
  grade: Grade;
  summary: string;
  agentsCovered: AgentType[];
}

export interface ScanReport {
  id: string;
  url: string;
  scannedAt: string;
  overallScore: number;
  grade: Grade;
  verdict: string;
  comparison: string;
  categories: CategoryScore[];
  journeys: AgentJourney[];
  findings: Finding[];
  actionPlan: ActionItem[];
  estimatedScoreAfterFixes: number;
  aiAgentScores?: Record<string, number>;
}

export interface AgentJourney {
  agentType: AgentType;
  agentName: string;
  agentDescription: string;
  overallResult: TestResult;
  steps: JourneyStep[];
  narrative: string;
}

export interface HumanAgentGap {
  what: string;
  why: string;
  recommendation: string;
}

export interface JourneyStep {
  stepNumber: number;
  action: string;
  description: string;
  result: TestResult;
  narration: string;
  screenshotUrl?: string;
  cursorTarget?: { x: number; y: number };
  thought?: string;
  duration?: number;
  humanAgentGaps?: HumanAgentGap[];
}

export interface Finding {
  id: string;
  severity: Severity;
  category: CategoryId;
  title: string;
  whatHappened: string;
  whyItMatters: string;
  affectedAgents: AffectedAgent[];
  fix: FixInstruction;
  priority: number;
  effort: "low" | "medium" | "high";
  estimatedPointsGain: number;
}

export interface AffectedAgent {
  name: string;
  impact: "blocked" | "degraded" | "fallback-available";
}

export interface FixInstruction {
  summary: string;
  codeSnippet?: string;
  technicalDetail: string;
  effortEstimate: string;
}

export interface ActionItem {
  findingId: string;
  title: string;
  severity: Severity;
  effort: "low" | "medium" | "high";
  estimatedPointsGain: number;
  isQuickWin: boolean;
}

export interface ScanConfig {
  url: string;
  productUrl?: string;
  productCategory?: string;
  agentTypes: AgentType[];
  email?: string;
}

export interface ScanJob {
  id: string;
  config: ScanConfig;
  status: "pending" | "running" | "completed" | "failed";
  currentStep: number;
  totalSteps: number;
  currentStepLabel: string;
  estimatedTimeRemaining: number;
  startedAt: string;
}

// ---- Index / Leaderboard Types ----

export interface BrandSummary {
  id: number;
  slug: string;
  name: string;
  category: string;
  latestScore: number | null;
  latestGrade: string | null;
  previousScore: number | null;
  delta: number | null;
  scannedAt: string | null;
  categoryScores: { categoryId: string; score: number }[];
  scoreHistory: ScoreHistoryPoint[];
  aiAgentScores?: Record<string, number>;
}

export interface ScoreHistoryPoint {
  date: string;
  score: number;
  grade?: string;
}

export interface BrandDetail extends BrandSummary {
  url: string;
  scoreHistory: ScoreHistoryPoint[];
  latestScan: ScanReport | null;
}
