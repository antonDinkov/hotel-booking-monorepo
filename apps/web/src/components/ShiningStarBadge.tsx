import { SparklesIcon } from "@heroicons/react/24/solid";

import type { HotelTrustBadge } from "@/types/review";

interface ShiningStarBadgeProps {
  badge?: HotelTrustBadge | null;
}

export default function ShiningStarBadge({ badge }: ShiningStarBadgeProps) {
  if (!badge) return null;

  return (
    <span
      title={badge.tooltip}
      aria-label={`${badge.label}: ${badge.tooltip}`}
      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-sm"
    >
      <SparklesIcon className="h-3.5 w-3.5" aria-hidden />
      {badge.label}
    </span>
  );
}
