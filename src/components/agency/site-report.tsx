import Link from "next/link";

type Readout = ReturnType<typeof import("@/lib/agency/core").buildSiteReadout>;

export function SiteReport({ item, compact = false }: { item: Readout; compact?: boolean }) {
  return (
    <article className="border-2 border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">{item.site.name}</h2>
          <a className="font-mono text-xs text-[#0259DD]" href={`https://${item.site.domain}`} target="_blank" rel="noreferrer">
            {item.site.domain}
          </a>
        </div>
        {item.score && (
          <div className="text-right">
            <div className="text-3xl font-black">{item.score.total}</div>
            <div className="spec-label text-muted-foreground">ARC SCORE</div>
          </div>
        )}
      </div>
      {!item.scan ? (
        <p className="mt-4 text-sm text-muted-foreground">Scan pending.</p>
      ) : item.stale ? (
        <p className="mt-4 text-sm text-amber-700">This scan is older than 72 hours and is excluded from outreach claims.</p>
      ) : (
        <>
          <div className="mt-5">
            <div className="spec-label text-muted-foreground mb-2">PRIORITY FINDINGS</div>
            {item.issues.length ? (
              <ol className="space-y-2">
                {item.issues.slice(0, compact ? 3 : 8).map((issue, index) => (
                  <li key={issue} className="flex gap-3 text-sm">
                    <span className="font-mono font-bold text-[#FF6648]">{String(index + 1).padStart(2, "0")}</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-emerald-700">No material readiness gaps detected in the latest scan.</p>
            )}
          </div>
          {!compact && item.fixes.length > 0 && (
            <div className="mt-6 border-t pt-5">
              <div className="spec-label text-muted-foreground mb-2">IMPLEMENTATION-READY FIXES</div>
              <div className="space-y-3">
                {item.fixes.slice(0, 4).map((fix) => (
                  <details key={fix.id} className="border bg-[#FFF8F0] p-3">
                    <summary className="cursor-pointer text-sm font-bold">{fix.title}</summary>
                    <pre className="mt-3 whitespace-pre-wrap text-xs leading-5">{fix.prompt}</pre>
                  </details>
                ))}
              </div>
            </div>
          )}
          {item.brand && (
            <Link href={`/brand/${item.brand.slug}`} className="inline-block mt-5 text-xs font-bold text-[#0259DD] hover:underline">
              Open public evidence record →
            </Link>
          )}
        </>
      )}
    </article>
  );
}
