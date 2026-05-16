import Link from "next/link";
import type { AdminBadgeTone, AdminStatCardProps } from "@/types/admin";

const toneClasses: Record<AdminBadgeTone, string> = {
  neutral: "border-slate-800",
  blue: "border-blue-500/40",
  amber: "border-amber-500/50",
  red: "border-red-500/50",
};

function CardContent({ label, value, detail, tone, trend }: AdminStatCardProps) {
  return (
    <div className={["border-l-2 bg-slate-950 p-4", toneClasses[tone ?? "neutral"]].join(" ")}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {trend ? <span className="text-[11px] text-slate-400">{trend}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default function AdminStatCard(props: AdminStatCardProps) {
  if (!props.href) return <CardContent {...props} />;

  return (
    <Link
      href={props.href}
      className="block rounded-[4px] border border-slate-800 transition hover:border-slate-700 hover:bg-slate-900"
    >
      <CardContent {...props} />
    </Link>
  );
}
