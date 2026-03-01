interface StatsBarProps {
  totalBrands: number;
  avgScore: number;
  lastUpdated: string | null;
}

export function StatsBar({ totalBrands, avgScore, lastUpdated }: StatsBarProps) {
  const dateStr = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="py-6">
      {/* Retro spec readout strip */}
      <div className="border border-[#E8E0D8] bg-white overflow-hidden">
        <div className="flex items-stretch divide-x divide-[#E8E0D8]">
          <SpecReadout
            label="TOTAL BRANDS"
            value={`${totalBrands}`}
            checked={totalBrands > 0}
          />
          <SpecReadout
            label="AVG SCORE"
            value={avgScore ? `${avgScore}/100` : "—"}
            checked={avgScore > 0}
          />
          <SpecReadout
            label="LAST SCAN"
            value={dateStr}
            checked={!!lastUpdated}
          />
          <SpecReadout
            label="FREQUENCY"
            value="DAILY"
            checked={true}
          />
        </div>
      </div>
    </div>
  );
}

function SpecReadout({
  label,
  value,
  checked,
}: {
  label: string;
  value: string;
  checked: boolean;
}) {
  return (
    <div className="flex-1 px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <div className="spec-label text-muted-foreground text-[9px] mb-0.5">{label}</div>
        <div className="data-num text-sm font-bold text-foreground">{value}</div>
      </div>
      {/* Retro checkbox */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-3 h-3 border-[1.5px] flex items-center justify-center ${
            checked
              ? "border-[#059669] bg-[#059669]"
              : "border-[#D8CFC5]"
          }`}
        >
          {checked && (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="square" />
            </svg>
          )}
        </div>
        <span className="spec-label text-[8px] text-muted-foreground">
          {checked ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}
