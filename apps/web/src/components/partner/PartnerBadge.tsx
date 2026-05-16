import type { PartnerBadgeProps, PartnerBadgeTone } from "@/types/partner";

const toneClasses: Record<PartnerBadgeTone, string> = {
  amber: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  emerald: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  indigo: "border-indigo-300/30 bg-indigo-300/10 text-indigo-200",
  rose: "border-rose-300/30 bg-rose-300/10 text-rose-200",
  slate: "border-slate-300/20 bg-slate-300/10 text-slate-200",
};

export default function PartnerBadge({
  children,
  tone = "slate",
}: PartnerBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
