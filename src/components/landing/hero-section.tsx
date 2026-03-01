"use client";

import { motion } from "framer-motion";
import { UrlInput } from "./url-input";
import { StoreAnimation } from "./store-animation";

export function HeroSection() {
  return (
    <section className="relative pt-12 sm:pt-16 pb-8 overflow-hidden">
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        {/* Headline */}
        <div className="text-center mb-8 sm:mb-10">
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-5"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-[11px] sm:text-xs font-medium text-indigo-600">
              Agent Readiness Check for Ecommerce
            </span>
          </motion.div>

          <motion.h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-[1.2] tracking-tight"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            Your customers&apos; AI agents
            <br />
            are ready to shop.{" "}
            <span className="text-indigo-600">Is your store?</span>
          </motion.h1>

          <motion.p
            className="mt-4 text-sm sm:text-[15px] text-gray-500 max-w-lg mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            We send AI agents to your site to search, click, add to cart, and
            buy. You get a score, a video of what happened, and exactly how to
            fix it.
          </motion.p>
        </div>

        {/* Store animation */}
        <motion.div
          className="mb-8 sm:mb-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <StoreAnimation />
        </motion.div>

        {/* URL input */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <UrlInput />
        </motion.div>

        <motion.p
          className="text-center text-[10px] sm:text-xs text-gray-400 mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
        >
          One scan &mdash; video replay, PDF report, and fixes. $49.
        </motion.p>
      </div>
    </section>
  );
}
