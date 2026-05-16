import Link from "next/link";
import type { AdminActionMenuProps, AdminActionTone } from "@/types/admin";

const toneClasses: Record<AdminActionTone, string> = {
  neutral: "border-slate-700 text-slate-300 hover:bg-slate-900",
  blue: "border-blue-500/40 text-blue-200 hover:bg-blue-500/10",
  amber: "border-amber-500/50 text-amber-200 hover:bg-amber-500/10",
  red: "border-red-500/50 text-red-200 hover:bg-red-500/10",
};

export default function AdminActionMenu({ actions }: AdminActionMenuProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {actions.map((action) => (
        <Link
          key={`${action.label}-${action.href}`}
          href={action.href}
          className={[
            "inline-flex items-center rounded-[3px] border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
            toneClasses[action.tone ?? "neutral"],
          ].join(" ")}
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}
