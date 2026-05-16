import type { PartnerBadgeTone, PartnerStatCardProps } from "@/types/partner";

const iconToneClasses: Record<PartnerBadgeTone, string> = {
  amber: "bg-amber-300/10 text-amber-200 ring-amber-300/20",
  emerald: "bg-emerald-300/10 text-emerald-200 ring-emerald-300/20",
  indigo: "bg-indigo-300/10 text-indigo-200 ring-indigo-300/20",
  rose: "bg-rose-300/10 text-rose-200 ring-rose-300/20",
  slate: "bg-slate-300/10 text-slate-200 ring-slate-300/20",
};

export default function PartnerStatCard({
  label,
  value,
  detail,
  trend,
  icon,
  tone = "slate",
}: PartnerStatCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/20 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-lg ring-1",
            iconToneClasses[tone],
          ].join(" ")}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-400">{detail}</span>
        {trend ? <span className="font-semibold text-emerald-200">{trend}</span> : null}
      </div>
    </div>
  );
}
