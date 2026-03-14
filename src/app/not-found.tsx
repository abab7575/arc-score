import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="w-16 h-16 bg-[#0259DD] flex items-center justify-center">
            <span className="text-2xl font-black text-white font-mono">?</span>
          </div>
          <div className="absolute inset-0 w-16 h-16 bg-[#FF6648] -z-10 translate-x-[3px] translate-y-[3px]" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="text-sm font-bold text-white bg-[#0259DD] hover:bg-[#0249BB] px-5 py-2 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/submit"
            className="text-sm font-bold text-foreground bg-gray-100 hover:bg-gray-200 px-5 py-2 transition-colors"
          >
            Submit Your Site
          </Link>
        </div>
      </div>
    </div>
  );
}
