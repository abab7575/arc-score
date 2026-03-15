"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function UrlInput() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const cleanUrl = url.trim().replace(/^https?:\/\//, "");
    router.push(`/configure?url=${encodeURIComponent(cleanUrl)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="relative group">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter your store URL"
          className="w-full h-13 sm:h-14 pl-5 pr-44 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1.5 h-10 sm:h-11 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          Get Your Score
          <ArrowRight size={14} />
        </button>
      </div>
    </form>
  );
}
