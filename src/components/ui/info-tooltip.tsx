"use client";

import { useState, useRef, useEffect } from "react";

interface InfoTooltipProps {
  /** The inline text/element to show the (i) icon next to */
  children?: React.ReactNode;
  /** The explanation shown on hover */
  content: string;
  /** Optional: extra detail shown below the main content */
  detail?: string;
  /** Size of the info icon */
  size?: "sm" | "md";
  /** Whether to render inline (next to text) or standalone */
  inline?: boolean;
}

export function InfoTooltip({
  children,
  content,
  detail,
  size = "sm",
  inline = true,
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // If not enough room above, show below
      setPosition(rect.top < 160 ? "bottom" : "top");
    }
  }, [open]);

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <span className={inline ? "inline-flex items-center gap-1" : "relative"}>
      {children}
      <span
        ref={triggerRef}
        className="relative cursor-help"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
      >
        <svg
          className={`${iconSize} text-gray-400 hover:text-gray-600 transition-colors`}
          fill="none"
          viewBox="0 0 20 20"
        >
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <text
            x="10"
            y="14"
            textAnchor="middle"
            fill="currentColor"
            fontSize="11"
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
          >
            i
          </text>
        </svg>

        {open && (
          <div
            ref={tooltipRef}
            className={`absolute z-[100] w-64 px-3 py-2.5 bg-gray-900 text-white rounded-lg shadow-xl
              ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"}
              left-1/2 -translate-x-1/2`}
            style={{ pointerEvents: "none" }}
          >
            {/* Arrow */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45
                ${position === "top" ? "bottom-[-4px]" : "top-[-4px]"}`}
            />
            <p className="text-[12px] leading-relaxed font-medium">{content}</p>
            {detail && (
              <p className="text-[11px] leading-relaxed text-gray-400 mt-1.5 border-t border-gray-700 pt-1.5">
                {detail}
              </p>
            )}
          </div>
        )}
      </span>
    </span>
  );
}

/**
 * Pre-built explainer definitions for common ARC Report terms.
 * Use: <InfoTooltip content={EXPLAINERS.acp} />
 */
export const EXPLAINERS = {
  arcScore:
    "ARC Score measures how easily AI shopping agents (like ChatGPT, Perplexity, or Google AI) can browse, understand products, and complete purchases on a website. Scored 0–100.",

  acpSupport:
    "ACP (Agentic Commerce Protocol) is an open standard that lets AI agents create checkout sessions and complete purchases programmatically — without needing to click through a browser.",
  acpYes:
    "This site supports ACP — AI agents can create checkout sessions and complete purchases programmatically without browser automation.",
  acpNo:
    "No ACP support detected. AI agents must use slower browser automation (clicking buttons, filling forms) to complete purchases.",
  acpUnknown:
    "We detected some API-like responses but couldn't confirm full ACP support. The site may have partial programmatic checkout capabilities.",

  agentCapability:
    "Overall score measuring how well AI agents can complete a full shopping journey on this site — from finding products to completing checkout. Higher is better.",
  discoverability:
    "Can AI agents find products on this site? This measures navigation structure, search functionality, and how easily agents can browse from the homepage to product pages.",
  frictionRisk:
    "How much resistance does this site put up against automated visitors? Low friction means agents can browse freely. High friction means bot detection, CAPTCHAs, or blocks.",

  protocol:
    "Does this site support standardized protocols (like ACP) that let AI agents interact programmatically, without needing to render pages in a browser?",
  cartCheckout:
    "Can AI agents add items to cart and initiate checkout through an API, or do they have to simulate mouse clicks on buttons?",
  payment:
    "How well does the payment flow work for AI agents? This includes tokenized payments, guest checkout availability, and programmatic payment initiation.",
  structuredData:
    "Does the site embed machine-readable product information (price, availability, descriptions) that agents can parse without reading the visual page? Uses standards like Schema.org and JSON-LD.",
  variants:
    "When a product comes in multiple sizes, colors, or configurations — can an AI agent clearly identify and select the right variant?",
  feedsSitemaps:
    "Does the site publish product data feeds and XML sitemaps that help AI agents discover and catalog all available products?",
  accessibility:
    "Are buttons, forms, and interactive elements properly labeled so that AI agents navigating via the accessibility tree (not visually) can understand and use them?",
  friction:
    "Does the site block or slow down automated visitors? This checks for bot detection, CAPTCHAs, rate limiting, and other anti-automation measures. Higher score = less blocking.",

  severityCritical:
    "Critical: This issue completely prevents AI agents from completing a key action (like purchasing). Fix this first.",
  severityHigh:
    "High: This issue significantly degrades the agent experience and will cause most AI agents to fail or give up.",
  severityMedium:
    "Medium: This issue causes friction but agents may still complete their task with workarounds or fallbacks.",
  severityLow:
    "Low: A minor gap that could improve agent performance but isn't blocking core functionality.",

  effort:
    "Estimated developer effort to implement this fix. Low = under 2 hours. Medium = 2–8 hours. High = 1–2 weeks.",
  pointsGain:
    "Estimated score improvement (out of 100) if this issue is fixed. Your total score is a weighted average across all categories.",

  evidence:
    "Key observations from our automated scan. These are specific signals our agents detected while testing this site's commerce capabilities.",

  agentJourney:
    "A step-by-step replay of what happened when our AI agent tried to shop on this site — from landing on the homepage to attempting checkout.",
  browserAgent:
    "Our Browser Agent navigates the site like a real AI shopping assistant would — clicking links, selecting product options, adding to cart, and attempting checkout.",
  dataAgent:
    "Our Data Agent reads the site's underlying code and data feeds — checking for structured product data, APIs, sitemaps, and machine-readable information that agents rely on.",
  accessibilityAgent:
    "Our Accessibility Agent tests whether the site's interactive elements (buttons, dropdowns, forms) are properly labeled and navigable without relying on visual rendering.",

  partial:
    "Partial means the agent was able to partially complete this step but encountered issues — it worked with limitations or required a fallback approach.",

  blocked:
    "The agent was completely unable to perform this action. This typically means the feature is broken or inaccessible for AI agents.",
  degraded:
    "The agent could perform this action but with significant difficulty or reduced reliability. The experience is noticeably worse than for a human user.",
  fallback:
    "The primary method failed, but the agent found an alternative way to complete the action. This works but is fragile and may break.",

  scoreTrend:
    "How this site's score has changed over the past 30 days. Score improvements typically result from fixing issues identified in previous scans.",
  delta:
    "Score change compared to the previous scan. A positive number means the site has improved its agent readiness since the last test.",

  gradeA: "Grade A (85–100): Agent-Ready — AI agents can successfully complete most shopping tasks on this site.",
  gradeB: "Grade B (70–84): Mostly Ready — the core shopping flow works for agents with minor friction points.",
  gradeC: "Grade C (50–69): Needs Work — agents struggle with key interactions and may fail to complete purchases.",
  gradeD: "Grade D (30–49): Poor — significant barriers prevent agents from completing basic shopping tasks.",
  gradeF: "Grade F (0–29): Not Ready — agents cannot meaningfully interact with this site.",
} as const;
