import type { ScanReport } from "@/types/report";
import { nikeReport } from "./nike";
import { allbirdsReport } from "./allbirds";
import { amazonReport } from "./amazon";
import { realNikeReport } from "./real-nike";

const reports: Record<string, ScanReport> = {
  "demo-nike": nikeReport,
  "demo-allbirds": allbirdsReport,
  "demo-amazon": amazonReport,
  "real-nike": realNikeReport,
};

export function getReport(id: string): ScanReport | null {
  return reports[id] ?? null;
}

export function getAllDemoReports(): ScanReport[] {
  return [realNikeReport, allbirdsReport, amazonReport];
}

export { nikeReport, allbirdsReport, amazonReport, realNikeReport };
