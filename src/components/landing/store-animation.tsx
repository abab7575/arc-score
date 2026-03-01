"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Star,
  Heart,
  CheckCircle2,
  XCircle,
  Shield,
  Loader2,
  Bot,
} from "lucide-react";

/* ─── Animation steps ─── */
interface AnimStep {
  id: string;
  label: string;
  thought: string;
  result: "pass" | "fail" | "working";
  cursorX: number;
  cursorY: number;
}

const STEPS: AnimStep[] = [
  {
    id: "homepage",
    label: "Navigate to store",
    thought: "Loading the store homepage...",
    result: "pass",
    cursorX: 50,
    cursorY: 22,
  },
  {
    id: "search",
    label: "Search for product",
    thought: 'Searching for "running shoes"...',
    result: "pass",
    cursorX: 62,
    cursorY: 9,
  },
  {
    id: "results",
    label: "Browse results",
    thought: "Found 24 results. Comparing options...",
    result: "pass",
    cursorX: 28,
    cursorY: 50,
  },
  {
    id: "product",
    label: "Open product page",
    thought: "This looks good. Checking details...",
    result: "pass",
    cursorX: 55,
    cursorY: 38,
  },
  {
    id: "size",
    label: "Select size",
    thought: "Selecting size 10...",
    result: "pass",
    cursorX: 64,
    cursorY: 56,
  },
  {
    id: "cart",
    label: "Add to cart",
    thought: "Adding to cart...",
    result: "pass",
    cursorX: 70,
    cursorY: 70,
  },
  {
    id: "checkout",
    label: "Proceed to checkout",
    thought: "Going to checkout...",
    result: "working",
    cursorX: 50,
    cursorY: 45,
  },
  {
    id: "blocked",
    label: "Blocked",
    thought: "I can't get through.",
    result: "fail",
    cursorX: 50,
    cursorY: 50,
  },
];

/* ─── Store Frames (light theme, fictional products) ─── */

function StoreHeader({
  searchActive,
  query,
}: {
  searchActive?: boolean;
  query?: string;
}) {
  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-indigo-500" />
        <span className="text-[9px] sm:text-[10px] font-semibold text-gray-800 tracking-wide">
          Stride & Co
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-4">
        {["New", "Men", "Women", "Sale"].map((n) => (
          <span key={n} className="text-[9px] text-gray-400 font-medium">
            {n}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] ${
            searchActive
              ? "bg-white border border-indigo-200 text-gray-700 shadow-sm"
              : "bg-gray-50 text-gray-400 border border-transparent"
          }`}
        >
          <Search
            size={9}
            className={searchActive ? "text-indigo-500" : "text-gray-300"}
          />
          {searchActive ? (
            <span className="text-gray-600">{query || "running shoes"}</span>
          ) : (
            <span>Search</span>
          )}
        </div>
        <ShoppingCart size={12} className="text-gray-400" />
      </div>
    </div>
  );
}

function ProductCard({
  name,
  price,
  highlight,
  rating,
  color,
}: {
  name: string;
  price: string;
  highlight?: boolean;
  rating?: number;
  color?: string;
}) {
  return (
    <div
      className={`rounded-lg overflow-hidden transition-shadow ${
        highlight
          ? "ring-2 ring-indigo-200 shadow-sm bg-white"
          : "bg-white border border-gray-100"
      }`}
    >
      <div
        className="aspect-square relative"
        style={{
          background: `linear-gradient(135deg, ${color || "#f3f4f6"} 0%, ${color ? color + "60" : "#e5e7eb"} 100%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-7 sm:w-12 sm:h-9 rounded-md bg-white/40" />
        </div>
      </div>
      <div className="p-1.5 sm:p-2">
        <p className="text-[8px] sm:text-[9px] text-gray-500 truncate leading-tight">
          {name}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[9px] sm:text-[10px] font-semibold text-gray-800">
            {price}
          </span>
          {rating && (
            <div className="flex items-center gap-0.5">
              <Star
                size={7}
                className="text-amber-400 fill-amber-400"
              />
              <span className="text-[7px] text-gray-400">{rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HomepageFrame() {
  return (
    <>
      <StoreHeader />
      <div className="mx-3 sm:mx-4 mt-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 p-3 sm:p-4 border border-indigo-100/50">
        <p className="text-[9px] sm:text-[10px] font-medium text-indigo-400 uppercase tracking-wider">
          New Arrivals
        </p>
        <p className="text-[11px] sm:text-xs font-bold text-gray-800 mt-0.5">
          Spring Collection 2026
        </p>
        <p className="text-[8px] text-gray-500 mt-1">
          Discover the latest in performance footwear
        </p>
      </div>
      <div className="px-3 sm:px-4 mt-3">
        <p className="text-[8px] sm:text-[9px] text-gray-400 font-medium mb-2">
          Popular Products
        </p>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          <ProductCard
            name="Trail Runner Pro"
            price="$129"
            rating={4.5}
            color="#dbeafe"
          />
          <ProductCard
            name="CloudStep Lite"
            price="$189"
            rating={4.3}
            color="#e0e7ff"
          />
          <ProductCard
            name="AirGlide Max"
            price="$149"
            rating={4.6}
            color="#ede9fe"
          />
          <ProductCard
            name="FlexRun 3"
            price="$159"
            rating={4.4}
            color="#fce7f3"
          />
        </div>
      </div>
    </>
  );
}

function SearchFrame() {
  return (
    <>
      <StoreHeader searchActive query="running shoes" />
      <div className="px-3 sm:px-4 mt-3">
        <p className="text-[8px] text-gray-400 mb-3">
          Searching for &ldquo;running shoes&rdquo;...
        </p>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg overflow-hidden bg-white border border-gray-100"
            >
              <div className="aspect-square bg-gray-50 animate-pulse" />
              <div className="p-1.5 space-y-1">
                <div className="h-1.5 bg-gray-100 rounded animate-pulse" />
                <div className="h-2 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ResultsFrame() {
  return (
    <>
      <StoreHeader searchActive query="running shoes" />
      <div className="px-3 sm:px-4 mt-2">
        <p className="text-[8px] sm:text-[9px] text-gray-400 mb-2">
          24 results for &ldquo;running shoes&rdquo;
        </p>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          <ProductCard
            name="SpeedPace 3"
            price="$159"
            rating={4.7}
            highlight
            color="#dbeafe"
          />
          <ProductCard
            name="EnduroFlex 26"
            price="$199"
            rating={4.8}
            color="#e0e7ff"
          />
          <ProductCard
            name="StrideBoost 4"
            price="$179"
            rating={4.6}
            color="#fce7f3"
          />
          <ProductCard
            name="PaceMaker Elite"
            price="$139"
            rating={4.5}
            color="#d1fae5"
          />
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-2">
          <ProductCard
            name="CloudStep Ultra"
            price="$169"
            rating={4.3}
            color="#ede9fe"
          />
          <ProductCard
            name="TrailBlaze 8"
            price="$149"
            rating={4.2}
            color="#fef3c7"
          />
          <ProductCard
            name="AirGlide Pro"
            price="$189"
            rating={4.4}
            color="#dbeafe"
          />
          <ProductCard
            name="FlexRun Lite"
            price="$119"
            rating={4.1}
            color="#fce7f3"
          />
        </div>
      </div>
    </>
  );
}

function ProductPageFrame({ sizeSelected }: { sizeSelected?: boolean }) {
  const sizes = ["7", "8", "9", "10", "11", "12"];
  return (
    <>
      <StoreHeader />
      <div className="flex gap-3 sm:gap-4 px-3 sm:px-4 mt-3">
        <div className="w-[40%] shrink-0">
          <div
            className="aspect-square rounded-xl relative border border-gray-100"
            style={{
              background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-10 sm:w-16 sm:h-12 rounded-lg bg-white/50" />
            </div>
          </div>
          <div className="flex gap-1 mt-1.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${
                  i === 0
                    ? "border-2 border-indigo-300 bg-indigo-50"
                    : "bg-gray-50 border border-gray-100"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] text-indigo-400 uppercase tracking-wider font-medium">
            Stride & Co Running
          </p>
          <p className="text-[11px] sm:text-xs font-bold text-gray-800 mt-0.5">
            SpeedPace 3
          </p>
          <p className="text-[12px] sm:text-sm font-bold text-gray-900 mt-1">
            $159.99
          </p>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={8}
                className={
                  i < 4
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-200"
                }
              />
            ))}
            <span className="text-[7px] text-gray-400 ml-0.5">(127)</span>
          </div>
          <p className="text-[8px] text-gray-400 mt-2.5 mb-1">Select Size</p>
          <div className="flex flex-wrap gap-1">
            {sizes.map((s) => (
              <div
                key={s}
                className={`w-6 h-5 sm:w-7 sm:h-6 rounded-md text-[8px] flex items-center justify-center font-medium transition-colors ${
                  sizeSelected && s === "10"
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-50 text-gray-500 border border-gray-200"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-3">
            <div className="flex-1 h-6 sm:h-7 rounded-lg bg-indigo-500 flex items-center justify-center gap-1.5 text-[9px] font-semibold text-white">
              <ShoppingCart size={10} />
              Add to Cart
            </div>
            <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
              <Heart size={10} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CartSuccessFrame() {
  return (
    <>
      <StoreHeader />
      <div className="flex gap-3 sm:gap-4 px-3 sm:px-4 mt-3">
        <div className="w-[55%] opacity-30">
          <div
            className="aspect-[4/3] rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
            }}
          />
        </div>
        <div className="w-[45%] bg-white rounded-xl border border-gray-200 shadow-sm p-2 sm:p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] sm:text-[10px] font-semibold text-gray-700">
              Cart (1)
            </p>
            <CheckCircle2 size={12} className="text-emerald-500" />
          </div>
          <div className="flex gap-2 mb-3">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
              }}
            />
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[9px] text-gray-600 truncate">
                SpeedPace 3
              </p>
              <p className="text-[8px] text-gray-400">Size: 10</p>
              <p className="text-[9px] sm:text-[10px] font-semibold text-gray-800">
                $159.99
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2 mb-2">
            <div className="flex justify-between text-[8px]">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-gray-600 font-medium">$159.99</span>
            </div>
          </div>
          <div className="h-5 sm:h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-[8px] sm:text-[9px] font-semibold text-white">
            Checkout
          </div>
        </div>
      </div>
    </>
  );
}

function CheckoutFrame() {
  return (
    <>
      <StoreHeader />
      <div className="px-4 sm:px-6 mt-3">
        <p className="text-[10px] sm:text-xs font-bold text-gray-800 mb-3">
          Checkout
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[8px] text-gray-400 uppercase tracking-wider font-medium">
              Shipping Address
            </p>
            {["Full Name", "Address", "City", "ZIP Code"].map((f) => (
              <div key={f} className="space-y-0.5">
                <p className="text-[7px] text-gray-400">{f}</p>
                <div className="h-4 rounded-md bg-gray-50 border border-gray-200" />
              </div>
            ))}
          </div>
          <div className="bg-gray-50 rounded-xl p-2 sm:p-3 border border-gray-100">
            <p className="text-[8px] text-gray-400 uppercase font-medium mb-2">
              Order Summary
            </p>
            <div className="flex gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
                }}
              />
              <div>
                <p className="text-[8px] text-gray-600">SpeedPace 3</p>
                <p className="text-[9px] font-semibold text-gray-800">
                  $159.99
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-2 space-y-1">
              <div className="flex justify-between text-[7px] text-gray-400">
                <span>Subtotal</span>
                <span>$159.99</span>
              </div>
              <div className="flex justify-between text-[7px] text-gray-400">
                <span>Shipping</span>
                <span>$9.99</span>
              </div>
              <div className="flex justify-between text-[8px] font-semibold text-gray-700 pt-1 border-t border-gray-200">
                <span>Total</span>
                <span>$169.98</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function BlockedFrame() {
  return (
    <>
      <StoreHeader />
      <div className="flex items-center justify-center h-[calc(100%-3rem)]">
        <div className="text-center px-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-3">
            <Shield size={24} className="text-red-500" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-red-600 mb-1">
            Access Denied
          </p>
          <p className="text-[9px] sm:text-[10px] text-gray-500 max-w-[200px] mx-auto leading-relaxed">
            Bot detection triggered. The agent cannot complete this purchase.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100">
            <XCircle size={10} className="text-red-500" />
            <span className="text-[8px] text-red-500 font-medium">
              Error 403: Automated access blocked
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function ScoreRevealFrame() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-red-200 bg-red-50 mb-3"
        >
          <div>
            <motion.span
              className="text-2xl sm:text-3xl font-bold text-red-600 block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              29
            </motion.span>
            <span className="text-[9px] text-gray-400">/ 100</span>
          </div>
        </motion.div>
        <motion.p
          className="text-xs sm:text-sm font-bold text-gray-800"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Grade F &mdash; Not Agent-Ready
        </motion.p>
        <motion.p
          className="text-[9px] sm:text-[10px] text-gray-500 mt-1 max-w-[240px] mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          AI agents cannot complete a purchase on this site. Revenue is being lost.
        </motion.p>
      </div>
    </div>
  );
}

function FrameContent({ stepId }: { stepId: string }) {
  switch (stepId) {
    case "homepage":
      return <HomepageFrame />;
    case "search":
      return <SearchFrame />;
    case "results":
      return <ResultsFrame />;
    case "product":
      return <ProductPageFrame />;
    case "size":
      return <ProductPageFrame sizeSelected />;
    case "cart":
      return <CartSuccessFrame />;
    case "checkout":
      return <CheckoutFrame />;
    case "blocked":
      return <BlockedFrame />;
    default:
      return <HomepageFrame />;
  }
}

export function StoreAnimation() {
  const totalSteps = STEPS.length + 1;
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= totalSteps) return 0;
      return next;
    });
  }, [totalSteps]);

  useEffect(() => {
    if (!isPlaying) return;
    const isScoreFrame = currentStep === totalSteps - 1;
    const isBlockedFrame = currentStep === STEPS.length - 1;
    const delay = isScoreFrame ? 4000 : isBlockedFrame ? 3500 : 2800;
    const timer = setTimeout(nextStep, delay);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, nextStep, totalSteps]);

  const step = currentStep < STEPS.length ? STEPS[currentStep] : null;
  const isScoreReveal = currentStep >= STEPS.length;

  return (
    <div className="relative">
      <div className="card-elevated overflow-hidden">
        {/* Browser chrome — light macOS style */}
        <div className="h-9 sm:h-10 bg-gray-50 border-b border-gray-200 flex items-center px-3 sm:px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-3 sm:mx-8">
            <div className="bg-white rounded-md px-3 py-1 text-[9px] sm:text-[10px] text-gray-400 font-mono flex items-center gap-1.5 border border-gray-200">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              strideandco.com
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 border border-indigo-100">
            <Bot size={10} className="text-indigo-500" />
            <span className="text-[8px] sm:text-[9px] text-indigo-600 font-medium hidden sm:block">
              AI Agent
            </span>
          </div>
        </div>

        {/* Content area */}
        <div className="relative h-[260px] sm:h-[320px] overflow-hidden bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {isScoreReveal ? (
                <ScoreRevealFrame />
              ) : (
                <FrameContent stepId={step!.id} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Animated cursor */}
          {step && !isScoreReveal && (
            <motion.div
              className="absolute pointer-events-none z-20"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                left: `${step.cursorX}%`,
                top: `${step.cursorY}%`,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <svg
                width="14"
                height="18"
                viewBox="0 0 16 20"
                fill="none"
                className="drop-shadow-md"
              >
                <path
                  d="M1 1L1 15L5.5 11L10 18L13 16.5L8.5 9.5L14 8.5L1 1Z"
                  fill="#4f46e5"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
              <motion.div
                className="absolute top-0 left-0 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-indigo-300"
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              />
            </motion.div>
          )}

          {/* Thought bubble */}
          {step && !isScoreReveal && (
            <motion.div
              key={`thought-${currentStep}`}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 max-w-[160px] sm:max-w-[200px] z-30"
              initial={{ opacity: 0, scale: 0.9, y: 3 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.25 }}
            >
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-[9px] sm:text-[10px] text-gray-600 leading-relaxed shadow-sm">
                <span className="text-indigo-500 font-medium mr-1">
                  Agent:
                </span>
                {step.thought}
              </div>
            </motion.div>
          )}
        </div>

        {/* Status bar */}
        <div className="h-10 bg-gray-50 border-t border-gray-200 flex items-center px-3 sm:px-4 gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            {isScoreReveal ? (
              <div className="flex items-center gap-1.5">
                <XCircle size={12} className="text-red-500 shrink-0" />
                <span className="text-[9px] sm:text-[10px] text-red-600 font-medium truncate">
                  Score: 29/100 &mdash; Not agent-ready
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                {step!.result === "pass" && (
                  <CheckCircle2
                    size={12}
                    className="text-emerald-500 shrink-0"
                  />
                )}
                {step!.result === "fail" && (
                  <XCircle size={12} className="text-red-500 shrink-0" />
                )}
                {step!.result === "working" && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="shrink-0"
                  >
                    <Loader2 size={12} className="text-indigo-500" />
                  </motion.div>
                )}
                <span className="text-[9px] sm:text-[10px] text-gray-500 truncate">
                  {step!.label}
                </span>
              </div>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  i < currentStep
                    ? s.result === "fail"
                      ? "bg-red-400"
                      : "bg-emerald-400"
                    : i === currentStep && !isScoreReveal
                      ? "bg-indigo-500"
                      : "bg-gray-200"
                }`}
              />
            ))}
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isScoreReveal ? "bg-red-400" : "bg-gray-200"
              }`}
            />
          </div>

          <span className="text-[9px] sm:text-[10px] text-gray-300 tabular-nums shrink-0">
            {currentStep + 1}/{totalSteps}
          </span>
        </div>
      </div>
    </div>
  );
}
