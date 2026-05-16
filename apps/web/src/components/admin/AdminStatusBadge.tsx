import type { AdminBadgeTone, AdminStatusBadgeProps } from "@/types/admin";

const toneClasses: Record<AdminBadgeTone, string> = {
  neutral: "border-slate-700 bg-slate-900 text-slate-300",
  blue: "border-blue-500/40 bg-blue-500/10 text-blue-200",
  amber: "border-amber-500/50 bg-amber-500/10 text-amber-200",
  red: "border-red-500/50 bg-red-500/10 text-red-200",
};

export default function AdminStatusBadge({
  label,
  tone = "neutral",
}: AdminStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-[3px] border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        toneClasses[tone],
      ].join(" ")}
    >
      {label}
    </span>
  );
}
