"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { InfoTooltip, EXPLAINERS } from "@/components/ui/info-tooltip";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CompareBrand {
  id: string;
  name: string;
  logoUrl?: string;
  overallScores: {
    agentCapability: number;
    discoverability: number;
    frictionRisk: "Low" | "Medium" | "High";
    acpSupport: boolean | "unknown";
  };
  categoryScores: {
    protocol: number;
    cartCheckout: number;
    payment: number;
    structuredData: number;
    variants: number;
    feedsSitemaps: number;
    accessibility: number;
    friction: number;
  };
  evidenceSummary: string[];
}

interface BrandCompareModuleProps {
  brands?: CompareBrand[];
  fetchBrandScores?: (brandId: string) => Promise<CompareBrand>;
}

// ── Category Metadata ──────────────────────────────────────────────────────

const CATEGORY_META: {
  key: keyof CompareBrand["categoryScores"];
  label: string;
  shortLabel: string;
  explainer: string;
}[] = [
  { key: "protocol", label: "Protocol (ACP)", shortLabel: "Protocol", explainer: EXPLAINERS.protocol },
  { key: "cartCheckout", label: "Cart & Checkout", shortLabel: "Cart", explainer: EXPLAINERS.cartCheckout },
  { key: "payment", label: "Payment Flow", shortLabel: "Payment", explainer: EXPLAINERS.payment },
  { key: "structuredData", label: "Structured Data", shortLabel: "Data", explainer: EXPLAINERS.structuredData },
  { key: "variants", label: "Variant Clarity", shortLabel: "Variants", explainer: EXPLAINERS.variants },
  { key: "feedsSitemaps", label: "Feeds & Sitemaps", shortLabel: "Feeds", explainer: EXPLAINERS.feedsSitemaps },
  { key: "accessibility", label: "Accessibility", shortLabel: "A11y", explainer: EXPLAINERS.accessibility },
  { key: "friction", label: "Friction Score", shortLabel: "Friction", explainer: EXPLAINERS.friction },
];

// ── Colors ─────────────────────────────────────────────────────────────────

const BRAND_A_COLOR = "#0259DD";
const BRAND_B_COLOR = "#FF6648";
const BRAND_A_LIGHT = "#EBF2FF";
const BRAND_B_LIGHT = "#FFF0EC";

// ── Helpers ────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#d97706";
  if (score >= 40) return "#ea580c";
  return "#dc2626";
}

function getFrictionBadge(risk: "Low" | "Medium" | "High") {
  if (risk === "Low") return { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" };
  if (risk === "Medium") return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
  return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
}

function getAcpLabel(val: boolean | "unknown"): string {
  if (val === true) return "YES";
  if (val === false) return "NO";
  return "UNKNOWN";
}

function getAcpBadge(val: boolean | "unknown") {
  if (val === true) return { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" };
  if (val === false) return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
  return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
}

function getWinner(a: number, b: number): "a" | "b" | "tie" {
  if (a > b) return "a";
  if (b > a) return "b";
  return "tie";
}

// ── Animated Counter ───────────────────────────────────────────────────────

function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = display;
    const duration = 800;
    const startTime = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{display}</span>;
}

// ── Brand Selector ─────────────────────────────────────────────────────────

function BrandSelector({
  brands, selected, onSelect, label, accentColor,
}: {
  brands: CompareBrand[];
  selected: CompareBrand | null;
  onSelect: (b: CompareBrand) => void;
  label: string;
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const filtered = brands.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-white hover:border-gray-300 transition-colors text-left"
      >
        {selected ? (
          <>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: accentColor }}>
              {selected.name[0]}
            </div>
            <span className="text-sm font-medium text-foreground truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Select a brand...</span>
        )}
        <svg className="w-4 h-4 text-gray-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-border shadow-lg overflow-hidden"
          >
            <div className="p-2">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search brands..." autoFocus
                className="w-full px-3 py-2 text-sm bg-gray-50 rounded-lg border-0 outline-none focus:ring-2 focus:ring-[#84AFFB]/40 placeholder:text-gray-400"
              />
            </div>
            <div className="max-h-56 overflow-y-auto px-1 pb-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">No brands found</div>
              ) : (
                filtered.map((b) => (
                  <button key={b.id}
                    onClick={() => { onSelect(b); setOpen(false); setQuery(""); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${selected?.id === b.id ? "bg-[#0259DD]/10 text-[#0259DD]" : "hover:bg-gray-50 text-foreground"}`}
                  >
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: selected?.id === b.id ? accentColor : "#9ca3af" }}>
                      {b.name[0]}
                    </div>
                    <span className="text-sm font-medium truncate">{b.name}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Badge Component ────────────────────────────────────────────────────────

function Badge({ label, style }: { label: string; style: { bg: string; text: string; border: string } }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border"
      style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}>
      {label}
    </span>
  );
}

// ── Brand Profile Header ───────────────────────────────────────────────────

function BrandProfileHeader({ brand, accentColor, align }: {
  brand: CompareBrand; accentColor: string; align: "left" | "right";
}) {
  const acpStyle = getAcpBadge(brand.overallScores.acpSupport);
  const frictionStyle = getFrictionBadge(brand.overallScores.frictionRisk);

  return (
    <div className={`flex-1 ${align === "right" ? "text-right" : "text-left"}`}>
      <div className={`flex items-center gap-3 mb-3 ${align === "right" ? "flex-row-reverse" : ""}`}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm"
          style={{ backgroundColor: accentColor }}>
          {brand.name[0]}
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">{brand.name}</h3>
          <div className="text-2xl font-bold data-num mt-0.5" style={{ color: getScoreColor(brand.overallScores.agentCapability) }}>
            <InfoTooltip content={EXPLAINERS.agentCapability}>
              <AnimatedNumber value={brand.overallScores.agentCapability} />
              <span className="text-sm font-medium text-muted-foreground ml-1">/100</span>
            </InfoTooltip>
          </div>
        </div>
      </div>
      <div className={`flex items-center gap-2 flex-wrap ${align === "right" ? "justify-end" : ""}`}>
        <InfoTooltip
          content={brand.overallScores.acpSupport === true ? EXPLAINERS.acpYes : brand.overallScores.acpSupport === false ? EXPLAINERS.acpNo : EXPLAINERS.acpUnknown}
          detail={EXPLAINERS.acpSupport}
        >
          <Badge label={`ACP: ${getAcpLabel(brand.overallScores.acpSupport)}`} style={acpStyle} />
        </InfoTooltip>
        <InfoTooltip content={EXPLAINERS.frictionRisk}>
          <Badge label={`Friction: ${brand.overallScores.frictionRisk}`} style={frictionStyle} />
        </InfoTooltip>
      </div>
    </div>
  );
}

// ── Mirrored Butterfly Bar Row ─────────────────────────────────────────────

function ButterflyBarRow({ label, scoreA, scoreB, index }: {
  label: string; scoreA: number; scoreB: number; index: number;
}) {
  const delay = 0.2 + index * 0.07;
  const winner = getWinner(scoreA, scoreB);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="py-3"
    >
      {/* Row: [scoreA] [bar-A ← ] [label] [ → bar-B] [scoreB] */}
      <div className="flex items-center gap-0">
        {/* Brand A score */}
        <div className="w-10 text-right shrink-0">
          <span className={`text-sm font-bold data-num ${winner === "a" ? "" : "opacity-60"}`}
            style={{ color: BRAND_A_COLOR }}>
            <AnimatedNumber value={scoreA} />
          </span>
        </div>

        {/* Brand A bar (grows right-to-left) */}
        <div className="flex-1 h-7 rounded-l-full bg-gray-50 overflow-hidden flex justify-end ml-2">
          <motion.div
            className="h-full rounded-l-full"
            style={{ backgroundColor: winner === "a" ? BRAND_A_COLOR : `${BRAND_A_COLOR}99` }}
            initial={{ width: 0 }}
            animate={{ width: `${scoreA}%` }}
            transition={{ duration: 0.9, delay: delay + 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>

        {/* Center label pill */}
        <div className="shrink-0 px-3 py-1 mx-1 bg-gray-800 rounded-md z-10 min-w-[110px] text-center">
          <span className="text-[10px] font-semibold text-white uppercase tracking-wider whitespace-nowrap">
            {label}
          </span>
        </div>

        {/* Brand B bar (grows left-to-right) */}
        <div className="flex-1 h-7 rounded-r-full bg-gray-50 overflow-hidden flex justify-start mr-2">
          <motion.div
            className="h-full rounded-r-full"
            style={{ backgroundColor: winner === "b" ? BRAND_B_COLOR : `${BRAND_B_COLOR}99` }}
            initial={{ width: 0 }}
            animate={{ width: `${scoreB}%` }}
            transition={{ duration: 0.9, delay: delay + 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>

        {/* Brand B score */}
        <div className="w-10 text-left shrink-0">
          <span className={`text-sm font-bold data-num ${winner === "b" ? "" : "opacity-60"}`}
            style={{ color: BRAND_B_COLOR }}>
            <AnimatedNumber value={scoreB} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Butterfly Breakdown Section ────────────────────────────────────────────

function ButterflyBreakdown({ brandA, brandB }: { brandA: CompareBrand; brandB: CompareBrand }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="card-elevated p-6"
    >
      {/* Column headers */}
      <div className="flex items-center mb-2">
        <div className="w-10 shrink-0" />
        <div className="flex-1 ml-2">
          <div className="flex items-center gap-1.5 justify-end">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_A_COLOR }} />
            <span className="text-xs font-semibold" style={{ color: BRAND_A_COLOR }}>{brandA.name}</span>
          </div>
        </div>
        <div className="min-w-[110px] mx-1 text-center">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Category</span>
        </div>
        <div className="flex-1 mr-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_B_COLOR }} />
            <span className="text-xs font-semibold" style={{ color: BRAND_B_COLOR }}>{brandB.name}</span>
          </div>
        </div>
        <div className="w-10 shrink-0" />
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 mb-1" />

      {/* Rows */}
      {CATEGORY_META.map((cat, i) => (
        <ButterflyBarRow
          key={cat.key}
          label={cat.label}
          scoreA={brandA.categoryScores[cat.key]}
          scoreB={brandB.categoryScores[cat.key]}
          index={i}
        />
      ))}
    </motion.div>
  );
}

// ── Radar Chart ────────────────────────────────────────────────────────────

function CompareRadarChart({ brandA, brandB }: { brandA: CompareBrand; brandB: CompareBrand }) {
  const data = CATEGORY_META.map((cat) => ({
    category: cat.shortLabel,
    fullLabel: cat.label,
    A: brandA.categoryScores[cat.key],
    B: brandB.categoryScores[cat.key],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="card-elevated p-6"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">
          <InfoTooltip content="Each axis represents a category score (0–100). The larger the filled area, the stronger the brand's agent commerce readiness in that dimension.">
            Radar Overview
          </InfoTooltip>
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_A_COLOR }} />
            <span className="text-[11px] text-muted-foreground">{brandA.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_B_COLOR }} />
            <span className="text-[11px] text-muted-foreground">{brandB.name}</span>
          </div>
        </div>
      </div>
      <div className="w-full" style={{ height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
            <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="category" tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 500 }} tickLine={false} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 9 }} tickCount={5} axisLine={false} />
            <Radar name={brandA.name} dataKey="A" stroke={BRAND_A_COLOR} fill={BRAND_A_COLOR}
              fillOpacity={0.18} strokeWidth={2.5} dot={{ r: 3.5, fill: BRAND_A_COLOR, strokeWidth: 0 }}
              animationBegin={300} animationDuration={900} animationEasing="ease-out" />
            <Radar name={brandB.name} dataKey="B" stroke={BRAND_B_COLOR} fill={BRAND_B_COLOR}
              fillOpacity={0.18} strokeWidth={2.5} dot={{ r: 3.5, fill: BRAND_B_COLOR, strokeWidth: 0 }}
              animationBegin={500} animationDuration={900} animationEasing="ease-out" />
            <Tooltip content={({ payload, label }) => {
              if (!payload || payload.length === 0) return null;
              const cat = CATEGORY_META.find((c) => c.shortLabel === label);
              return (
                <div className="bg-white rounded-lg border border-gray-200 shadow-lg px-3 py-2 text-xs">
                  <div className="font-semibold text-foreground mb-1">{cat?.label ?? label}</div>
                  {payload.map((p) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-muted-foreground">{p.name}:</span>
                      <span className="font-bold data-num" style={{ color: p.color }}>{p.value}</span>
                    </div>
                  ))}
                </div>
              );
            }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ── Evidence Section ───────────────────────────────────────────────────────

function EvidencePanel({ brandA, brandB }: { brandA: CompareBrand; brandB: CompareBrand }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <EvidenceCard brand={brandA} accentColor={BRAND_A_COLOR} accentBg={BRAND_A_LIGHT} />
      <EvidenceCard brand={brandB} accentColor={BRAND_B_COLOR} accentBg={BRAND_B_LIGHT} />
    </motion.div>
  );
}

function EvidenceCard({ brand, accentColor, accentBg }: {
  brand: CompareBrand; accentColor: string; accentBg: string;
}) {
  return (
    <div className="card-soft p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
          style={{ backgroundColor: accentColor }}>
          {brand.name[0]}
        </div>
        <h4 className="text-sm font-semibold text-foreground">{brand.name}</h4>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground ml-auto">
          <InfoTooltip content={EXPLAINERS.evidence}>Key Findings</InfoTooltip>
        </span>
      </div>
      <ul className="space-y-2">
        {brand.evidenceSummary.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: accentColor }} />
            <span className="text-xs leading-relaxed text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 px-3 py-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: accentBg }}>
        <InfoTooltip content={EXPLAINERS.acpSupport} size="sm">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ACP Support</span>
        </InfoTooltip>
        <InfoTooltip
          content={brand.overallScores.acpSupport === true ? EXPLAINERS.acpYes : brand.overallScores.acpSupport === false ? EXPLAINERS.acpNo : EXPLAINERS.acpUnknown}
        >
          <Badge label={getAcpLabel(brand.overallScores.acpSupport)} style={getAcpBadge(brand.overallScores.acpSupport)} />
        </InfoTooltip>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">Select two brands to compare</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        Choose Brand A and Brand B above to see a side-by-side comparison of their agent commerce readiness.
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function BrandCompareModule({ brands: propBrands, fetchBrandScores }: BrandCompareModuleProps) {
  const [allBrands, setAllBrands] = useState<CompareBrand[]>(propBrands ?? []);
  const [brandA, setBrandA] = useState<CompareBrand | null>(null);
  const [brandB, setBrandB] = useState<CompareBrand | null>(null);
  const [loading, setLoading] = useState(!propBrands);

  useEffect(() => {
    if (propBrands) return;
    fetch("/api/compare/brands")
      .then((r) => r.json())
      .then((data) => { setAllBrands(data.brands ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [propBrands]);

  const handleSelectA = useCallback(async (b: CompareBrand) => {
    if (fetchBrandScores) { setBrandA(await fetchBrandScores(b.id)); } else { setBrandA(b); }
  }, [fetchBrandScores]);

  const handleSelectB = useCallback(async (b: CompareBrand) => {
    if (fetchBrandScores) { setBrandB(await fetchBrandScores(b.id)); } else { setBrandB(b); }
  }, [fetchBrandScores]);

  const bothSelected = brandA && brandB;

  if (loading) {
    return <div className="text-center py-20 text-sm text-muted-foreground">Loading brands...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ── Selector Row ── */}
      <div className="flex items-end gap-3 md:gap-4">
        <BrandSelector brands={allBrands} selected={brandA} onSelect={handleSelectA} label="Brand A" accentColor={BRAND_A_COLOR} />
        <div className="shrink-0 pb-1">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-white">VS</span>
          </div>
        </div>
        <BrandSelector brands={allBrands} selected={brandB} onSelect={handleSelectB} label="Brand B" accentColor={BRAND_B_COLOR} />
      </div>

      {/* ── Comparison Content ── */}
      <AnimatePresence mode="wait">
        {bothSelected ? (
          <motion.div
            key={`${brandA.id}-${brandB.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* ── Profile Headers ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="card-elevated p-6"
            >
              <div className="flex items-start gap-4">
                <BrandProfileHeader brand={brandA} accentColor={BRAND_A_COLOR} align="left" />

                <div className="shrink-0 flex flex-col items-center justify-center pt-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-500">VS</span>
                  </div>
                </div>

                <BrandProfileHeader brand={brandB} accentColor={BRAND_B_COLOR} align="right" />
              </div>
            </motion.div>

            {/* ── Butterfly Score Breakdown ── */}
            <ButterflyBreakdown brandA={brandA} brandB={brandB} />

            {/* ── Radar Chart ── */}
            <CompareRadarChart brandA={brandA} brandB={brandB} />

            {/* ── Evidence ── */}
            <EvidencePanel brandA={brandA} brandB={brandB} />
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
