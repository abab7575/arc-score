"use client";

import { motion } from "framer-motion";
import {
  Search,
  MousePointerClick,
  ShoppingCart,
  CreditCard,
  Database,
  Accessibility,
  Play,
  FileText,
  BarChart3,
  Code2,
} from "lucide-react";

/* ─── What we test ─── */

const checks = [
  {
    icon: Search,
    label: "Find products",
    detail: "Can an agent search, browse categories, and discover products?",
  },
  {
    icon: MousePointerClick,
    label: "Navigate & interact",
    detail: "Can it click buttons, select sizes, and dismiss popups?",
  },
  {
    icon: ShoppingCart,
    label: "Add to cart",
    detail: "Can it add products with the right variant to the cart?",
  },
  {
    icon: CreditCard,
    label: "Complete checkout",
    detail: "Can it fill forms, enter shipping, and finish the purchase?",
  },
];

/* ─── Three agents ─── */

const agents = [
  {
    icon: MousePointerClick,
    label: "Browser Agent",
    detail:
      "Navigates your site like a real customer's agent — clicking, scrolling, and filling forms.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    icon: Database,
    label: "Data Agent",
    detail:
      "Reads your structured data, product feeds, and APIs to understand your catalog.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
  },
  {
    icon: Accessibility,
    label: "Accessibility Agent",
    detail:
      "Uses ARIA labels and the accessibility tree to interact without rendering the page.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
];

/* ─── What you get ─── */

const deliverables = [
  {
    icon: Play,
    label: "Video Replay",
    detail:
      "Watch exactly what the agent saw, where it clicked, and where it got stuck. Share it in seconds.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: FileText,
    label: "PDF Report",
    detail:
      "A scored breakdown across every category. Print it, email it, attach it to a brief.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: BarChart3,
    label: "Executive Summary",
    detail:
      "A clear, one-page overview your CMO, CEO, or commercial director can read in 2 minutes.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Code2,
    label: "Technical Fixes",
    detail:
      "Code snippets and specific instructions your dev team can implement today. No guesswork.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
];

export function HowItWorks() {
  return (
    <section className="py-14 sm:py-20">
      {/* ─── What we test ─── */}
      <div className="text-center mb-10 sm:mb-12">
        <motion.h2
          className="text-lg sm:text-xl font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          We test the full shopping journey
        </motion.h2>
        <motion.p
          className="text-sm text-gray-500 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Your score reflects whether AI agents can complete each step of a real
          purchase — from discovery to checkout.
        </motion.p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-16 sm:mb-20">
        {checks.map((c, i) => (
          <motion.div
            key={c.label}
            className="card-soft p-4 text-center"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 mb-3">
              <c.icon size={18} className="text-indigo-500" />
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-800 mb-1">
              {c.label}
            </p>
            <p className="text-[10px] sm:text-[11px] text-gray-500 leading-relaxed">
              {c.detail}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ─── Three agents ─── */}
      <div className="text-center mb-8 sm:mb-10">
        <motion.h3
          className="text-base sm:text-lg font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Three agents. Three perspectives.
        </motion.h3>
        <motion.p
          className="text-sm text-gray-500 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          We test your site from every angle — just like real personal agents
          will.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-16 sm:mb-20">
        {agents.map((a, i) => (
          <motion.div
            key={a.label}
            className={`card-soft p-5 border ${a.border}`}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <div
              className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${a.bg} mb-3`}
            >
              <a.icon size={18} className={a.color} />
            </div>
            <p className="text-xs font-semibold text-gray-800 mb-1">
              {a.label}
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              {a.detail}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ─── What you get ─── */}
      <div className="text-center mb-8 sm:mb-10">
        <motion.h3
          className="text-base sm:text-lg font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Everything you need in one report
        </motion.h3>
        <motion.p
          className="text-sm text-gray-500 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          From the boardroom to the codebase — one scan gives your whole team
          what they need.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-12 sm:mb-14">
        {deliverables.map((d, i) => (
          <motion.div
            key={d.label}
            className="card-soft p-5 flex gap-4"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <div
              className={`shrink-0 w-10 h-10 rounded-lg ${d.bg} flex items-center justify-center`}
            >
              <d.icon size={20} className={d.color} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-0.5">
                {d.label}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                {d.detail}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── Score scale ─── */}
      <motion.div
        className="card-elevated p-6 sm:p-8 max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <p className="text-sm font-bold text-gray-900 mb-1.5">
          Your ARC Score: 0 &ndash; 100
        </p>
        <p className="text-xs text-gray-500 leading-relaxed mb-5 max-w-sm mx-auto">
          A single number that tells you how ready your store is for AI-powered
          shopping.
        </p>
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          {[
            { grade: "A", label: "Agent-Ready", color: "#059669", bg: "#ecfdf5" },
            { grade: "B", label: "Mostly Ready", color: "#4f46e5", bg: "#eef2ff" },
            { grade: "C", label: "Needs Work", color: "#d97706", bg: "#fffbeb" },
            { grade: "D", label: "Poor", color: "#ea580c", bg: "#fff7ed" },
            { grade: "F", label: "Not Ready", color: "#dc2626", bg: "#fef2f2" },
          ].map((g) => (
            <div
              key={g.grade}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-100"
              style={{ backgroundColor: g.bg }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: g.color }}
              >
                {g.grade}
              </span>
              <span className="text-[10px] text-gray-500">{g.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
