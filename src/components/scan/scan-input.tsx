"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Compact homepage entry point for the instant free scan. */
export function ScanInput() {
  const [domain, setDomain] = useState("");
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (domain.trim()) router.push(`/scan?domain=${encodeURIComponent(domain.trim())}`);
      }}
      className="flex flex-col sm:flex-row gap-3"
    >
      <input
        type="text"
        inputMode="url"
        placeholder="> yourstore.com"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        className="flex-1 border-2 border-white/20 bg-white/10 px-4 py-3 text-sm font-mono text-white placeholder:text-white/40 focus:outline-none focus:border-[#84AFFB] transition-colors"
        aria-label="Domain to scan"
      />
      <button
        type="submit"
        className="relative text-sm font-bold text-[#0A1628] bg-[#FBBA16] hover:bg-[#ffc93a] px-6 py-3 transition-all hover:translate-y-[-2px] group"
      >
        Scan free →
        <span className="absolute inset-0 bg-[#FF6648] -z-10 translate-x-[3px] translate-y-[3px] group-hover:translate-x-[4px] group-hover:translate-y-[4px] transition-transform" />
      </button>
    </form>
  );
}
