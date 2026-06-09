"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * URL-driven brand picker: selection state lives in ?brands= so every
 * comparison is shareable. Server re-renders the comparison on navigation.
 */
export function CompareControls({
  current,
  options,
  max,
}: {
  current: string[];
  options: Array<{ slug: string; name: string }>;
  max: number;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");

  const navigate = (slugs: string[]) => {
    router.push(slugs.length > 0 ? `/compare?brands=${slugs.join(",")}` : "/compare");
  };

  const add = (raw: string) => {
    const q = raw.trim().toLowerCase();
    if (!q) return;
    const match =
      options.find((o) => o.slug === q) ??
      options.find((o) => o.name.toLowerCase() === q) ??
      options.find((o) => o.name.toLowerCase().includes(q) || o.slug.includes(q));
    if (match && !current.includes(match.slug) && current.length < max) {
      navigate([...current, match.slug]);
      setInput("");
    }
  };

  const nameOf = (slug: string) => options.find((o) => o.slug === slug)?.name ?? slug;

  return (
    <div className="border-2 border-gray-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {current.map((slug) => (
          <span
            key={slug}
            className="inline-flex items-center gap-1.5 bg-[#0A1628] text-white text-xs font-semibold px-2.5 py-1.5"
          >
            {nameOf(slug)}
            <button
              onClick={() => navigate(current.filter((s) => s !== slug))}
              aria-label={`Remove ${nameOf(slug)}`}
              className="text-white/60 hover:text-white font-bold"
            >
              ×
            </button>
          </span>
        ))}
        {current.length === 0 && (
          <span className="text-xs text-muted-foreground">Pick 2–{max} brands to compare.</span>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add(input);
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text"
          list="compare-brand-options"
          placeholder={current.length >= max ? `Maximum ${max} brands` : "Add a brand — e.g. Nike"}
          value={input}
          disabled={current.length >= max}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0259DD] disabled:bg-gray-50"
          aria-label="Add brand to comparison"
        />
        <datalist id="compare-brand-options">
          {options.map((o) => (
            <option key={o.slug} value={o.name} />
          ))}
        </datalist>
        <button
          type="submit"
          disabled={current.length >= max}
          className="text-sm font-bold text-white bg-[#0259DD] hover:bg-[#024bb5] disabled:opacity-50 px-5 py-2 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}
