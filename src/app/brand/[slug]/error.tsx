"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function BrandError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Brand page error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 bg-[#FF6648] flex items-center justify-center">
          <span className="text-2xl font-black text-white font-mono">!</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Couldn&apos;t load this brand
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          This brand may not have been scanned yet, or the scan data is still processing. Try again in a moment.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="text-sm font-bold text-white bg-[#0259DD] hover:bg-[#0249BB] px-5 py-2 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="text-sm font-bold text-foreground bg-gray-100 hover:bg-gray-200 px-5 py-2 transition-colors"
          >
            Back to Index
          </Link>
        </div>
      </div>
    </div>
  );
}
