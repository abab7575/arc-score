"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { getGradeColor, getGradeLabel } from "@/lib/scoring";
import type { Grade } from "@/types/report";

const demos: {
  name: string;
  url: string;
  score: number;
  grade: Grade;
  id: string;
  badge?: string;
}[] = [
  {
    name: "Nike",
    url: "nike.com",
    score: 29,
    grade: "F",
    id: "real-nike",
    badge: "Real Scan",
  },
  {
    name: "Allbirds",
    url: "allbirds.com",
    score: 81,
    grade: "B",
    id: "demo-allbirds",
  },
  {
    name: "Amazon",
    url: "amazon.com",
    score: 89,
    grade: "A",
    id: "demo-amazon",
  },
];

function MiniGauge({ score, grade }: { score: number; grade: Grade }) {
  const color = getGradeColor(grade);
  const size = 52;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: dashOffset }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span
        className="absolute text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

export function DemoScoreCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {demos.map((demo, i) => (
        <motion.div
          key={demo.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.35 }}
        >
          <Link
            href={`/report/${demo.id}`}
            className="card-soft p-4 sm:p-5 flex items-center gap-4 hover:shadow-md transition-shadow block relative"
          >
            {demo.badge && (
              <span className="absolute top-2.5 right-2.5 text-[9px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                {demo.badge}
              </span>
            )}
            <MiniGauge score={demo.score} grade={demo.grade} />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {demo.name}
              </p>
              <p className="text-xs text-gray-400">{demo.url}</p>
              <p
                className="text-xs font-medium mt-1"
                style={{ color: getGradeColor(demo.grade) }}
              >
                Grade {demo.grade} &mdash; {getGradeLabel(demo.grade)}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
