import Link from "next/link";
import AdminStatusBadge from "./AdminStatusBadge";
import type { AdminFiltersProps } from "@/types/admin";

export default function AdminFilters({ label = "Filters", filters }: AdminFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {filters.map((filter) => (
        <Link
          key={filter.href}
          href={filter.href}
          className={[
            "inline-flex items-center gap-2 rounded-[3px] border px-2.5 py-1.5 text-xs transition",
            filter.active
              ? "border-blue-500/40 bg-blue-500/10 text-blue-200"
              : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200",
          ].join(" ")}
        >
          {filter.label}
          {typeof filter.count === "number" ? (
            <AdminStatusBadge label={String(filter.count)} tone={filter.tone ?? "neutral"} />
          ) : null}
        </Link>
      ))}
    </div>
  );
}
