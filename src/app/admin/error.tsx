"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground mb-2">Admin Error</div>
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || "Something went wrong loading this page."}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-[#0259DD] text-white text-sm font-medium rounded-md hover:bg-[#0249BB] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
