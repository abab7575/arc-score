"use client";

import { useState } from "react";
import type { ScoreHistoryPoint } from "@/types/report";

interface ScoreTrendChartProps {
  data: ScoreHistoryPoint[];
}

const GRADE_ZONES = [
  { min: 85, color: "#dcfce7", label: "A" },
  { min: 70, color: "#eef2ff", label: "B" },
  { min: 50, color: "#fffbeb", label: "C" },
  { min: 30, color: "#fff7ed", label: "D" },
  { min: 0, color: "#fef2f2", label: "F" },
];

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length < 2) {
    return (
      <div className="card-soft rounded-xl p-6 text-center text-sm text-muted-foreground">
        Score trend will appear after 2+ scans.
      </div>
    );
  }

  const width = 600;
  const height = 200;
  const padX = 40;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const minScore = 0;
  const maxScore = 100;

  const toX = (i: number) => padX + (i / (data.length - 1)) * chartW;
  const toY = (score: number) => padY + chartH - ((score - minScore) / (maxScore - minScore)) * chartH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d.score)}`).join(" ");

  // Gradient fill path
  const fillPath = `${linePath} L ${toX(data.length - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;

  return (
    <div className="card-soft rounded-xl p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Score Trend (30 days)</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" onMouseLeave={() => setHoverIndex(null)}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.01} />
          </linearGradient>
        </defs>

        {/* Grade zone bands */}
        {GRADE_ZONES.map((zone, i) => {
          const nextMin = i > 0 ? GRADE_ZONES[i - 1].min : 100;
          const y1 = toY(nextMin);
          const y2 = toY(zone.min);
          return (
            <rect
              key={zone.label}
              x={padX}
              y={y1}
              width={chartW}
              height={y2 - y1}
              fill={zone.color}
              opacity={0.4}
            />
          );
        })}

        {/* Y-axis labels */}
        {[0, 30, 50, 70, 85, 100].map((v) => (
          <text key={v} x={padX - 6} y={toY(v) + 3} textAnchor="end" className="fill-gray-400 text-[9px]">
            {v}
          </text>
        ))}

        {/* Grid lines */}
        {[30, 50, 70, 85].map((v) => (
          <line
            key={v}
            x1={padX}
            y1={toY(v)}
            x2={padX + chartW}
            y2={toY(v)}
            stroke="#e5e7eb"
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
        ))}

        {/* Fill */}
        <path d={fillPath} fill="url(#trendGradient)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={toX(i)}
            cy={toY(d.score)}
            r={hoverIndex === i ? 5 : 3}
            fill="#4f46e5"
            stroke="white"
            strokeWidth={2}
            className="cursor-pointer"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}

        {/* Hover tooltip */}
        {hoverIndex !== null && (
          <g>
            <rect
              x={toX(hoverIndex) - 30}
              y={toY(data[hoverIndex].score) - 28}
              width={60}
              height={20}
              rx={4}
              fill="#1e293b"
            />
            <text
              x={toX(hoverIndex)}
              y={toY(data[hoverIndex].score) - 14}
              textAnchor="middle"
              className="fill-white text-[10px] font-medium"
            >
              {data[hoverIndex].score}/100
            </text>
          </g>
        )}

        {/* X-axis date labels (first and last) */}
        <text x={toX(0)} y={height - 2} textAnchor="start" className="fill-gray-400 text-[9px]">
          {new Date(data[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </text>
        <text x={toX(data.length - 1)} y={height - 2} textAnchor="end" className="fill-gray-400 text-[9px]">
          {new Date(data[data.length - 1].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </text>
      </svg>
    </div>
  );
}
