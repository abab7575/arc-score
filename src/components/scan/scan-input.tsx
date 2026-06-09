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
      className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl"
    >
      <input
        type="text"
        inputMode="url"
        placeholder="Scan any site — yourstore.com"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        className="flex-1 border-2 border-white/20 bg-white/10 px-4 py-3 text-sm font-mono text-white placeholder:text-white/40 focus:outline-none focus:border-[#84AFFB]"
        aria-label="Domain to scan"
      />
      <button
        type="submit"
        className="text-sm font-bold text-[#0A1628] bg-white hover:bg-white/90 px-6 py-3 transition-colors"
      >
        Scan free →
      </button>
    </form>
  );
}
