"use client";

import { AI_AGENT_PROFILES, getFeedAgents, getBrowserAgents } from "@/lib/ai-agents";
import type { AIAgentProfile } from "@/lib/ai-agents";
import type { CategoryScore } from "@/types/report";
import { getGrade } from "@/lib/scoring";
import { getGradeColor } from "@/lib/scoring";
import { CATEGORY_CONFIG } from "@/lib/constants";
import type { CategoryId } from "@/types/report";
import { Rss, Monitor, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface AgentCompatibilityProps {
  scores?: Record<string, number>;
  categories: CategoryScore[];
}

function AgentScoreCard({
  agent,
  score,
  categories,
}: {
  agent: AIAgentProfile;
  score: number;
  categories: CategoryScore[];
}) {
  const [expanded, setExpanded] = useState(false);
  const grade = getGrade(score);
  const gradeColor = getGradeColor(grade);

  const topWeights = Object.entries(agent.weights)
    .filter(([, w]) => w > 0)
    .sort(([, a], [, b]) => b - a) as [CategoryId, number][];

  return (
    <div
      className="card-soft rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
              agent.type === "feed" ? "bg-[#0259DD]/10" : "bg-[#FF6648]/10"
            }`}
          >
            {agent.type === "feed" ? (
              <Rss size={14} className="text-[#0259DD]" />
            ) : (
              <Monitor size={14} className="text-[#FF6648]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{agent.name}</p>
            <p className="text-[10px] text-muted-foreground">{agent.company}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="data-num text-sm font-bold" style={{ color: gradeColor }}>
              {score}
            </span>
            <span className="text-[10px] text-muted-foreground ml-0.5">/100</span>
          </div>
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
            style={{ backgroundColor: gradeColor }}
          >
            {grade}
          </div>
          {expanded ? (
            <ChevronUp size={12} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={12} className="text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">
            Score Breakdown
          </p>
          <div className="space-y-1.5">
            {topWeights.map(([catId, weight]) => {
              const cat = categories.find((c) => c.id === catId);
              const catScore = cat?.score ?? 0;
              const contribution = Math.round(catScore * weight);
              return (
                <div key={catId} className="flex items-center gap-2 text-[11px]">
                  <span className="text-muted-foreground w-32 truncate">
                    {CATEGORY_CONFIG[catId].name}
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${catScore}%`,
                        backgroundColor: getGradeColor(getGrade(catScore)),
                      }}
                    />
                  </div>
                  <span className="data-num text-muted-foreground w-6 text-right">
                    {catScore}
                  </span>
                  <span className="text-[9px] text-muted-foreground w-8">
                    x{Math.round(weight * 100)}%
                  </span>
                  <span className="data-num font-medium text-foreground w-5 text-right">
                    {contribution}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentCompatibility({ scores, categories }: AgentCompatibilityProps) {
  if (!scores) return null;

  const feedAgents = getFeedAgents();
  const browserAgents = getBrowserAgents();

  const feedAvg = Math.round(
    feedAgents.reduce((sum, a) => sum + (scores[a.id] ?? 0), 0) / feedAgents.length
  );
  const browserAvg = Math.round(
    browserAgents.reduce((sum, a) => sum + (scores[a.id] ?? 0), 0) / browserAgents.length
  );

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Agent Compatibility</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            How well this site works with each AI shopping agent
          </p>
        </div>
        <div className="flex gap-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Feed Avg</p>
            <p className="data-num text-sm font-bold" style={{ color: getGradeColor(getGrade(feedAvg)) }}>
              {feedAvg}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Browser Avg</p>
            <p className="data-num text-sm font-bold" style={{ color: getGradeColor(getGrade(browserAvg)) }}>
              {browserAvg}
            </p>
          </div>
        </div>
      </div>

      {/* Feed/API Agents */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Rss size={12} className="text-[#0259DD]" />
          <h3 className="text-xs font-semibold text-foreground">Feed / API-First Agents</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {feedAgents.map((agent) => (
            <AgentScoreCard
              key={agent.id}
              agent={agent}
              score={scores[agent.id] ?? 0}
              categories={categories}
            />
          ))}
        </div>
      </div>

      {/* Browser Agents */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Monitor size={12} className="text-[#FF6648]" />
          <h3 className="text-xs font-semibold text-foreground">Browser-Automation Agents</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {browserAgents.map((agent) => (
            <AgentScoreCard
              key={agent.id}
              agent={agent}
              score={scores[agent.id] ?? 0}
              categories={categories}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
