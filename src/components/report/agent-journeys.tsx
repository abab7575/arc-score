"use client";

import { useState } from "react";
import { Globe, Database, Eye, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { AgentJourney, TestResult } from "@/types/report";
import { AgentSimulation } from "./agent-simulation";
import { AgentReplay } from "./agent-replay";
import { JourneyTimeline } from "./journey-timeline";
import { InfoTooltip, EXPLAINERS } from "@/components/ui/info-tooltip";

const AGENT_ICONS = {
  browser: Globe,
  data: Database,
  accessibility: Eye,
};

function ResultPill({ result }: { result: TestResult }) {
  const config = {
    pass: { label: "Pass", className: "bg-emerald-50 text-emerald-600", Icon: CheckCircle2, tooltip: "The agent successfully completed this journey." },
    partial: { label: "Partial", className: "bg-amber-50 text-amber-600", Icon: AlertCircle, tooltip: EXPLAINERS.partial },
    fail: { label: "Fail", className: "bg-red-50 text-red-600", Icon: XCircle, tooltip: "The agent was unable to complete this journey." },
  };
  const { label, className, Icon, tooltip } = config[result];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`} title={tooltip}>
      <Icon size={12} />
      {label}
    </span>
  );
}

interface AgentJourneysProps {
  journeys: AgentJourney[];
  siteName: string;
}

export function AgentJourneys({ journeys, siteName }: AgentJourneysProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<"simulation" | "timeline">("simulation");

  return (
    <section className="py-12">
      <h2 className="text-xl font-semibold text-foreground mb-1">
        Agent Journey Replay
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        <InfoTooltip content={EXPLAINERS.agentJourney}>
          Watch what happened when our AI agents tried to shop on {siteName} — from landing on the homepage to attempting checkout.
        </InfoTooltip>
      </p>

      {/* Agent tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {journeys.map((journey, i) => {
          const Icon = AGENT_ICONS[journey.agentType];
          const isActive = i === activeTab;
          const agentTooltips: Record<string, string> = {
            browser: EXPLAINERS.browserAgent,
            data: EXPLAINERS.dataAgent,
            accessibility: EXPLAINERS.accessibilityAgent,
          };

          return (
            <button
              key={journey.agentType}
              onClick={() => setActiveTab(i)}
              title={agentTooltips[journey.agentType]}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-white border border-gray-200 shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              <span className="font-medium">{journey.agentName}</span>
              <ResultPill result={journey.overallResult} />
            </button>
          );
        })}
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setViewMode("simulation")}
          title="Watch a step-by-step visual replay of the agent's actions"
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === "simulation"
              ? "bg-[#0259DD] text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Step-by-Step View
        </button>
        <button
          onClick={() => setViewMode("timeline")}
          title="See all agent actions listed chronologically"
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === "timeline"
              ? "bg-[#0259DD] text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Timeline View
        </button>
      </div>

      {/* Journey content */}
      {journeys.map((journey, i) => (
        <div key={journey.agentType} className={i === activeTab ? "" : "hidden"}>
          {/* Agent description and narrative */}
          <div className="card-soft rounded-xl p-5 mb-6">
            <p className="text-xs text-muted-foreground mb-3">
              {journey.agentDescription}
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed italic">
              &ldquo;{journey.narrative}&rdquo;
            </p>
          </div>

          {viewMode === "simulation" ? (
            <AgentReplay steps={journey.steps} siteName={siteName} />
          ) : (
            <JourneyTimeline steps={journey.steps} />
          )}
        </div>
      ))}
    </section>
  );
}
