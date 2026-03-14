"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 bg-[#FF6648] flex items-center justify-center">
          <span className="text-2xl font-black text-white font-mono">!</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          We hit an unexpected error loading this page. This has been logged and we&apos;ll look into it.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="text-sm font-bold text-white bg-[#0259DD] hover:bg-[#0249BB] px-5 py-2 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="text-sm font-bold text-foreground bg-gray-100 hover:bg-gray-200 px-5 py-2 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
