"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getGradeColor } from "@/lib/scoring";
import type { Grade } from "@/types/report";

interface ScanEntry {
  id: number;
  overallScore: number;
  grade: string;
  scannedAt: string;
}

interface ScanHistoryProps {
  scans: ScanEntry[];
}

export function ScanHistory({ scans }: ScanHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  if (scans.length === 0) {
    return null;
  }

  const visible = expanded ? scans : scans.slice(0, 5);

  return (
    <div className="card-soft rounded-xl p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Scan History</h3>
      <div className="space-y-2">
        {visible.map((scan, i) => {
          const prevScan = scans[i + 1];
          const delta = prevScan ? scan.overallScore - prevScan.overallScore : null;
          const color = getGradeColor(scan.grade as Grade);

          return (
            <div key={scan.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-xs text-muted-foreground">
                {new Date(scan.scannedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <div className="flex items-center gap-3">
                <span className="data-num text-sm font-semibold" style={{ color }}>
                  {scan.overallScore}
                </span>
                <span className="data-num text-xs font-bold" style={{ color }}>
                  {scan.grade}
                </span>
                {delta !== null && delta !== 0 && (
                  <span className={`data-num text-xs ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {delta > 0 ? "+" : ""}{delta}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {scans.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {expanded ? "Show less" : `Show all ${scans.length} scans`}
        </button>
      )}
    </div>
  );
}
