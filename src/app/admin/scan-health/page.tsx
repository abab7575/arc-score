"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface ScanHealth {
  overallStatus: "green" | "yellow" | "red";
  todayRun: {
    id: number;
    status: string;
    totalBrands: number;
    completed: number;
    failed: number;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
  latestRun: {
    id: number;
    status: string;
    totalBrands: number;
    completed: number;
    failed: number;
    changesDetected: number;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
  failedBrands: { brandSlug: string; brandName: string; error: string }[];
  dataFreshness: {
    freshBrands: number;
    totalBrands: number;
    percentage: number;
  };
  neverScanned: number;
  last7Days: {
    date: string;
    status: string;
    completed: number;
    failed: number;
    changes: number;
  }[];
  workerActive: boolean;
}

const STATUS_COLORS = {
  green: { bg: "bg-emerald-500", text: "text-emerald-700", label: "Healthy" },
  yellow: { bg: "bg-amber-500", text: "text-amber-700", label: "Warning" },
  red: { bg: "bg-red-500", text: "text-red-700", label: "Critical" },
};

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function ScanHealthPage() {
  const [health, setHealth] = useState<ScanHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchHealth() {
    setLoading(true);
    try {
      const res = await fetch("/api/scan-health");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setHealth(data);
      setError(null);
    } catch {
      setError("Failed to load scan health");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="text-center py-16 text-muted-foreground">Loading scan health...</div>
    );
  }

  if (error && !health) {
    return (
      <div className="text-center py-16 text-red-500">{error}</div>
    );
  }

  if (!health) return null;

  const status = STATUS_COLORS[health.overallStatus];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Scan Health</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Operational status of the daily lightweight scanner
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${status.bg} ${health.latestRun?.status === "running" ? "animate-pulse" : ""}`} />
            <span className={`text-sm font-semibold ${status.text}`}>{status.label}</span>
          </div>
          <button
            onClick={fetchHealth}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Worker status */}
      <div className="border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2 h-2 rounded-full ${health.workerActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-sm font-semibold text-foreground">
            Worker: {health.workerActive ? "Active" : "Stopped"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {health.workerActive
            ? "Serial worker is running and processing queued scan jobs."
            : "Worker is not running. Scan jobs will not be processed."}
        </p>
      </div>

      {/* Today's Run */}
      <div className="border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
          Today&apos;s Run
        </h2>
        {health.todayRun ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-semibold text-foreground capitalize">{health.todayRun.status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-sm font-semibold text-foreground">
                  {health.todayRun.completed + health.todayRun.failed} / {health.todayRun.totalBrands}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className={`text-sm font-semibold ${health.todayRun.failed > 0 ? "text-red-600" : "text-foreground"}`}>
                  {health.todayRun.failed}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDuration(health.todayRun.startedAt, health.todayRun.completedAt)}
                </p>
              </div>
            </div>
            {health.todayRun.status === "running" && (
              <div className="w-full bg-gray-100 h-2 overflow-hidden">
                <div
                  className="h-full bg-[#0259DD] transition-all duration-500"
                  style={{
                    width: `${Math.round(((health.todayRun.completed + health.todayRun.failed) / health.todayRun.totalBrands) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No scan has run today yet.</p>
        )}
      </div>

      {/* Data Freshness */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-gray-200 bg-white p-4">
          <p className="text-xs text-muted-foreground mb-1">Data Freshness (&lt;24h)</p>
          <p className="text-2xl font-black text-foreground">{health.dataFreshness.percentage}%</p>
          <p className="text-xs text-muted-foreground">
            {health.dataFreshness.freshBrands} / {health.dataFreshness.totalBrands} brands
          </p>
        </div>
        <div className="border border-gray-200 bg-white p-4">
          <p className="text-xs text-muted-foreground mb-1">Never Scanned</p>
          <p className={`text-2xl font-black ${health.neverScanned > 0 ? "text-red-600" : "text-foreground"}`}>
            {health.neverScanned}
          </p>
          <p className="text-xs text-muted-foreground">
            {health.neverScanned === 0 ? "All brands have data" : "Brands with no scan data"}
          </p>
        </div>
        <div className="border border-gray-200 bg-white p-4">
          <p className="text-xs text-muted-foreground mb-1">Changes Detected</p>
          <p className="text-2xl font-black text-foreground">
            {health.latestRun?.changesDetected ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">In latest run</p>
        </div>
      </div>

      {/* Failed Brands */}
      {health.failedBrands.length > 0 && (
        <div className="border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-bold text-red-800 mb-2">
            Failed Brands ({health.failedBrands.length})
          </h2>
          <div className="space-y-1">
            {health.failedBrands.slice(0, 20).map((fb) => (
              <div key={fb.brandSlug} className="flex items-center justify-between text-xs">
                <span className="font-medium text-red-700">{fb.brandName}</span>
                <span className="text-red-500 truncate ml-4 max-w-xs">{fb.error}</span>
              </div>
            ))}
            {health.failedBrands.length > 20 && (
              <p className="text-xs text-red-500 mt-2">
                + {health.failedBrands.length - 20} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Last 7 Days */}
      <div className="border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
          Last 7 Days
        </h2>
        {health.last7Days.length > 0 ? (
          <div className="grid grid-cols-7 gap-2">
            {health.last7Days.map((day) => (
              <div key={day.date} className="text-center">
                <p className="text-[10px] text-muted-foreground mb-1">
                  {new Date(day.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <div
                  className={`w-8 h-8 mx-auto flex items-center justify-center text-xs font-bold text-white ${
                    day.status === "completed" && day.failed === 0
                      ? "bg-emerald-500"
                      : day.status === "completed" && day.failed > 0
                      ? "bg-amber-500"
                      : day.status === "running"
                      ? "bg-blue-500"
                      : "bg-red-500"
                  }`}
                >
                  {day.status === "completed" ? "✓" : day.status === "running" ? "…" : "✗"}
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">
                  {day.completed}/{day.completed + day.failed}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No scan history yet.</p>
        )}
      </div>
    </div>
  );
}
