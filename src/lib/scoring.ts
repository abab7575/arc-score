import type { Grade, Severity } from "@/types/report";
import { GRADE_THRESHOLDS, SEVERITY_CONFIG } from "./constants";

export function getGrade(score: number): Grade {
  for (const threshold of GRADE_THRESHOLDS) {
    if (score >= threshold.min) return threshold.grade;
  }
  return "F";
}

export function getGradeColor(grade: Grade): string {
  const found = GRADE_THRESHOLDS.find((t) => t.grade === grade);
  return found?.color ?? "#ef4444";
}

export function getGradeLabel(grade: Grade): string {
  const found = GRADE_THRESHOLDS.find((t) => t.grade === grade);
  return found?.label ?? "Unknown";
}

export function getScoreColor(score: number): string {
  return getGradeColor(getGrade(score));
}

export function getSeverityColor(severity: Severity): string {
  return SEVERITY_CONFIG[severity].color;
}

export function getResultColor(result: "pass" | "partial" | "fail"): string {
  switch (result) {
    case "pass":
      return "#059669";
    case "partial":
      return "#d97706";
    case "fail":
      return "#dc2626";
  }
}

export function getResultLabel(result: "pass" | "partial" | "fail"): string {
  switch (result) {
    case "pass":
      return "Pass";
    case "partial":
      return "Partial";
    case "fail":
      return "Fail";
  }
}
