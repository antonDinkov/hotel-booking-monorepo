import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { AdminSearchBarProps } from "@/types/admin";

export default function AdminSearchBar({
  placeholder = "Search users, partners, bookings, reports",
  compact = false,
}: AdminSearchBarProps) {
  return (
    <label className="relative block w-full">
      <span className="sr-only">Admin search</span>
      <MagnifyingGlassIcon
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
      <input
        type="search"
        placeholder={placeholder}
        className={[
          "w-full rounded-[4px] border border-slate-800 bg-slate-950 pl-9 pr-3 text-xs text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30",
          compact ? "h-8" : "h-9",
        ].join(" ")}
      />
    </label>
  );
}
