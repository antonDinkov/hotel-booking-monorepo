import type { PartnerChartPlaceholderProps } from "@/types/partner";
import PartnerCard from "./PartnerCard";

export default function PartnerChartPlaceholder({
  title,
  value,
  caption,
  bars = [36, 48, 54, 72, 64, 82],
}: PartnerChartPlaceholderProps) {
  return (
    <PartnerCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-300">{title}</h2>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{caption}</p>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
          Preview
        </span>
      </div>
      <div className="mt-6 flex h-28 items-end gap-2">
        {bars.map((height, index) => (
          <div
            key={`${title}-${index}`}
            className="min-w-0 flex-1 rounded-t bg-gradient-to-t from-indigo-500/50 via-emerald-400/50 to-amber-200/70"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </PartnerCard>
  );
}
