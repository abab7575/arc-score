"use client";

import { RotateCcw, BarChart3, Share2, ArrowRight } from "lucide-react";

export function WhatsNext() {
  return (
    <section className="py-12 border-t border-gray-200">
      <h2 className="text-xl font-semibold text-foreground mb-6">
        What&apos;s Next
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/"
          className="card-soft rounded-xl p-5 hover:bg-gray-50 transition-colors group"
        >
          <RotateCcw size={20} className="text-indigo-600 mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Re-scan After Fixes
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Made changes? Run another scan to verify improvements and see your
            updated score.
          </p>
          <div className="flex items-center gap-1 mt-3 text-xs text-indigo-600 group-hover:gap-2 transition-all">
            <span>Scan again</span>
            <ArrowRight size={12} />
          </div>
        </a>

        <div className="card-soft rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
              Coming Soon
            </span>
          </div>
          <BarChart3 size={20} className="text-muted-foreground mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Weekly Monitoring
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Automated weekly scans with trend tracking and email alerts when your
            score changes. $99/mo.
          </p>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
          className="card-soft rounded-xl p-5 hover:bg-gray-50 transition-colors group text-left"
        >
          <Share2 size={20} className="text-indigo-600 mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Share This Report
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Send this report to your team. No login required to view.
          </p>
          <div className="flex items-center gap-1 mt-3 text-xs text-indigo-600 group-hover:gap-2 transition-all">
            <span>Copy link</span>
            <ArrowRight size={12} />
          </div>
        </button>
      </div>
    </section>
  );
}
