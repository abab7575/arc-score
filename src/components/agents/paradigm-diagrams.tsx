"use client";

import { motion } from "framer-motion";

/**
 * Feed/API-First Diagram
 *
 * Shows: Chat interface → structured data extraction → your site's data layer
 * The agent never "sees" the website UI — it reads structured data.
 */
export function FeedAgentDiagram() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#0259DD]/[0.03] to-[#0259DD]/[0.08] border border-[#0259DD]/10 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-3">

        {/* Chat Interface */}
        <div className="w-full sm:w-[38%] shrink-0">
          <div className="rounded-lg border border-[#0259DD]/20 bg-white shadow-sm overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0259DD]/5 border-b border-[#0259DD]/10">
              <div className="w-2 h-2 rounded-full bg-[#0259DD]/30" />
              <div className="w-2 h-2 rounded-full bg-[#0259DD]/20" />
              <div className="w-2 h-2 rounded-full bg-[#0259DD]/10" />
              <span className="text-[9px] font-mono font-bold text-[#0259DD]/60 ml-1.5">AI SHOPPING AGENT</span>
            </div>
            <div className="p-3 space-y-2.5">
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-[#0259DD] text-white text-[10px] px-3 py-1.5 rounded-xl rounded-br-sm max-w-[85%] leading-relaxed">
                  Find me white running shoes under $150
                </div>
              </div>
              {/* Agent thinking */}
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 text-[10px] text-muted-foreground px-3 py-1.5 rounded-xl rounded-bl-sm max-w-[85%] leading-relaxed">
                  <span className="text-[#0259DD] font-semibold">Searching feeds...</span>
                  <span className="inline-block ml-1 animate-pulse">|</span>
                </div>
              </div>
              {/* Agent response with product */}
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 text-[10px] text-muted-foreground px-3 py-2 rounded-xl rounded-bl-sm max-w-[90%]">
                  <div className="flex gap-2 items-start">
                    <div className="w-10 h-10 rounded bg-[#0259DD]/10 flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-mono text-[#0259DD]">IMG</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-[10px] leading-tight">Nike Air Zoom Pegasus 41</p>
                      <p className="text-[9px] text-muted-foreground">White/Pure Platinum</p>
                      <p className="text-[10px] font-bold text-[#0259DD] mt-0.5">$130.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Flow Arrows */}
        <div className="flex sm:flex-col items-center gap-1 shrink-0 py-2 sm:py-0">
          <motion.div
            className="hidden sm:flex flex-col items-center gap-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-[8px] font-mono text-[#0259DD]/60 rotate-0">READS</span>
            <div className="flex flex-col items-center">
              <div className="w-px h-3 bg-[#0259DD]/20" />
              <svg width="20" height="12" viewBox="0 0 20 12" className="text-[#0259DD]/40">
                <path d="M2 2 L10 10 L18 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[8px] font-mono text-[#0259DD]/60">DATA</span>
          </motion.div>
          {/* Horizontal arrows for mobile */}
          <div className="flex sm:hidden items-center gap-1">
            <svg width="24" height="12" viewBox="0 0 24 12" className="text-[#0259DD]/40 rotate-90">
              <path d="M2 2 L12 10 L22 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Structured Data Layer */}
        <div className="w-full sm:flex-1">
          <div className="space-y-2">
            {/* Website representation - faded/ghost */}
            <div className="rounded-lg border border-dashed border-gray-200 bg-white/50 p-2.5 opacity-40">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-3 h-3 rounded bg-gray-200" />
                <div className="h-1.5 w-16 bg-gray-200 rounded" />
                <div className="h-1.5 w-8 bg-gray-100 rounded ml-auto" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-8 flex-1 bg-gray-100 rounded" />
                <div className="h-8 flex-1 bg-gray-100 rounded" />
                <div className="h-8 flex-1 bg-gray-100 rounded" />
              </div>
              <p className="text-[8px] text-center text-muted-foreground mt-1.5 font-mono">WEBSITE UI — NOT USED</p>
            </div>

            {/* What it actually reads */}
            <div className="rounded-lg border border-[#0259DD]/20 bg-white shadow-sm p-2.5">
              <p className="text-[8px] font-mono font-bold text-[#0259DD] mb-2 uppercase tracking-wider">Structured Data Layer</p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded bg-[#0259DD]/5 px-2 py-1.5 border border-[#0259DD]/10">
                  <span className="text-[8px] font-mono text-[#0259DD] font-bold block">JSON-LD</span>
                  <span className="text-[8px] text-muted-foreground leading-tight block mt-0.5">Product schema</span>
                </div>
                <div className="rounded bg-[#0259DD]/5 px-2 py-1.5 border border-[#0259DD]/10">
                  <span className="text-[8px] font-mono text-[#0259DD] font-bold block">XML</span>
                  <span className="text-[8px] text-muted-foreground leading-tight block mt-0.5">Sitemap & feeds</span>
                </div>
                <div className="rounded bg-[#0259DD]/5 px-2 py-1.5 border border-[#0259DD]/10">
                  <span className="text-[8px] font-mono text-[#0259DD] font-bold block">ACP</span>
                  <span className="text-[8px] text-muted-foreground leading-tight block mt-0.5">Checkout API</span>
                </div>
                <div className="rounded bg-[#0259DD]/5 px-2 py-1.5 border border-[#0259DD]/10">
                  <span className="text-[8px] font-mono text-[#0259DD] font-bold block">OG</span>
                  <span className="text-[8px] text-muted-foreground leading-tight block mt-0.5">Meta tags</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="text-[9px] font-mono text-[#0259DD]/50 text-center mt-4">
        The agent reads your data — it never opens a browser or sees your UI
      </p>
    </div>
  );
}

/**
 * Browser Automation Diagram
 *
 * Shows: AI agent cursor navigating a real storefront browser window
 * Step by step: homepage → product → add to cart → checkout
 */
export function BrowserAgentDiagram() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#FF6648]/[0.03] to-[#FF6648]/[0.08] border border-[#FF6648]/10 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-3">

        {/* AI Agent */}
        <div className="w-full sm:w-[30%] shrink-0">
          <div className="rounded-lg border border-[#FF6648]/20 bg-white shadow-sm overflow-hidden">
            {/* Agent header */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FF6648]/5 border-b border-[#FF6648]/10">
              <div className="w-2 h-2 rounded-full bg-[#FF6648]/30" />
              <div className="w-2 h-2 rounded-full bg-[#FF6648]/20" />
              <div className="w-2 h-2 rounded-full bg-[#FF6648]/10" />
              <span className="text-[9px] font-mono font-bold text-[#FF6648]/60 ml-1.5">BROWSER AGENT</span>
            </div>
            <div className="p-3 space-y-2">
              {/* Agent thought process */}
              <div className="rounded bg-[#FF6648]/5 border border-[#FF6648]/10 px-2.5 py-2">
                <p className="text-[8px] font-mono text-[#FF6648] font-bold mb-1">TASK</p>
                <p className="text-[10px] text-foreground leading-relaxed">Find white running shoes, add to cart</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-[7px] text-emerald-600">&#10003;</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">Navigate to site</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-[7px] text-emerald-600">&#10003;</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">Find product</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF6648]/10 flex items-center justify-center">
                    <span className="text-[7px] text-[#FF6648]">&#9654;</span>
                  </div>
                  <span className="text-[9px] text-foreground font-medium">Click &quot;Add to Cart&quot;</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-[7px] text-gray-400">&#9679;</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">Proceed to checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action arrows */}
        <div className="flex sm:flex-col items-center gap-1 shrink-0 py-2 sm:py-0">
          <motion.div
            className="hidden sm:flex flex-col items-center gap-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-[8px] font-mono text-[#FF6648]/60">CLICKS</span>
            <div className="flex flex-col items-center">
              <div className="w-px h-3 bg-[#FF6648]/20" />
              <svg width="20" height="12" viewBox="0 0 20 12" className="text-[#FF6648]/40">
                <path d="M2 2 L10 10 L18 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[8px] font-mono text-[#FF6648]/60">& TYPES</span>
          </motion.div>
          <div className="flex sm:hidden items-center gap-1">
            <svg width="24" height="12" viewBox="0 0 24 12" className="text-[#FF6648]/40 rotate-90">
              <path d="M2 2 L12 10 L22 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Browser Window — the actual website */}
        <div className="w-full sm:flex-1">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="w-2 h-2 rounded-full bg-red-300" />
              <div className="w-2 h-2 rounded-full bg-yellow-300" />
              <div className="w-2 h-2 rounded-full bg-green-300" />
              <div className="flex-1 mx-2 h-4 rounded bg-white border border-gray-200 flex items-center px-2">
                <span className="text-[8px] text-muted-foreground font-mono">https://store.example.com/shoes/pegasus-41</span>
              </div>
            </div>

            {/* Page content */}
            <div className="p-3">
              {/* Nav bar */}
              <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-100">
                <div className="w-8 h-3 bg-gray-800 rounded-sm" />
                <div className="flex gap-2">
                  <div className="h-1.5 w-6 bg-gray-200 rounded" />
                  <div className="h-1.5 w-8 bg-gray-200 rounded" />
                  <div className="h-1.5 w-6 bg-gray-200 rounded" />
                </div>
                <div className="h-3 w-3 bg-gray-200 rounded ml-auto" />
              </div>

              {/* Product page layout */}
              <div className="flex gap-3">
                {/* Product image */}
                <div className="w-[45%] shrink-0">
                  <div className="aspect-square rounded bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-100">
                    <div className="text-center">
                      <div className="text-lg">&#128095;</div>
                      <p className="text-[7px] text-muted-foreground mt-0.5">Product Image</p>
                    </div>
                  </div>
                </div>

                {/* Product details */}
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="h-2 w-full bg-gray-200 rounded mb-1" />
                    <div className="h-2 w-3/4 bg-gray-100 rounded" />
                  </div>
                  <div className="h-2.5 w-12 bg-gray-800 rounded" />

                  {/* Size selector */}
                  <div className="flex gap-1">
                    <div className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center">
                      <span className="text-[7px]">8</span>
                    </div>
                    <div className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center">
                      <span className="text-[7px]">9</span>
                    </div>
                    <div className="w-5 h-5 rounded border-2 border-[#FF6648] bg-[#FF6648]/5 flex items-center justify-center">
                      <span className="text-[7px] font-bold text-[#FF6648]">10</span>
                    </div>
                    <div className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center">
                      <span className="text-[7px]">11</span>
                    </div>
                  </div>

                  {/* Add to cart button — the target */}
                  <div className="relative">
                    <div className="bg-gray-900 text-white text-[9px] font-bold px-3 py-1.5 rounded text-center">
                      ADD TO CART
                    </div>
                    {/* Cursor pointing at the button */}
                    <motion.div
                      className="absolute -top-1 -right-1"
                      initial={{ x: 10, y: -10, opacity: 0 }}
                      animate={{ x: 0, y: 0, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                        <path d="M1 1L1 14L4.5 10.5L7.5 17L10 16L7 9L12 9L1 1Z" fill="#FF6648" stroke="#fff" strokeWidth="1" />
                      </svg>
                    </motion.div>
                    {/* Click ripple */}
                    <motion.div
                      className="absolute inset-0 rounded border-2 border-[#FF6648]"
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{ opacity: [0, 0.5, 0], scale: [1, 1.1, 1.2] }}
                      transition={{ delay: 1, duration: 0.8, repeat: Infinity, repeatDelay: 3 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="text-[9px] font-mono text-[#FF6648]/50 text-center mt-4">
        The agent opens a real browser and navigates your site like a human would
      </p>
    </div>
  );
}
