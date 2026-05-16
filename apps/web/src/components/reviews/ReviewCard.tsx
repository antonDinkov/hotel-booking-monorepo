import { StarIcon as OutlineStar } from "@heroicons/react/24/outline";
import { StarIcon as SolidStar } from "@heroicons/react/24/solid";

import { formatReviewDate } from "@/lib/review-format";
import type { ReviewCardData } from "@/types/review";
import ReviewReply from "./ReviewReply";

type ReviewCardMode = "compact" | "full";

interface ReviewCardProps {
  review: ReviewCardData;
  mode?: ReviewCardMode;
  showHotelInfo?: boolean;
  showPartnerReply?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "G";
}

function ReviewAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-800">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={`${name} avatar`} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">{getInitials(name)}</div>
      )}
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        index < rating
          ? <SolidStar key={index} className="h-4 w-4 text-amber-400" />
          : <OutlineStar key={index} className="h-4 w-4 text-amber-200" />
      ))}
    </div>
  );
}

export default function ReviewCard({
  review,
  mode = "full",
  showHotelInfo = false,
  showPartnerReply = true,
}: ReviewCardProps) {
  const reviewerName = review.userName?.trim() || "Guest";
  const isCompact = mode === "compact";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
      {showHotelInfo && review.hotelName ? (
        <div className="mb-4 border-b border-slate-100 pb-4">
          <p className="text-sm font-semibold text-blue-950">{review.hotelName}</p>
          {review.hotelLocation ? (
            <p className="mt-1 text-xs text-slate-500">{review.hotelLocation}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <ReviewAvatar name={reviewerName} avatarUrl={review.userAvatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">{reviewerName}</p>
              <p className="text-xs text-slate-500">{formatReviewDate(review.createdAt)}</p>
            </div>
            <RatingStars rating={review.rating} />
          </div>

          <p className={`${isCompact ? "mt-3 text-sm" : "mt-4 text-base"} leading-7 text-slate-700`}>
            {review.comment ?? "No written comment."}
          </p>

          {showPartnerReply && review.partnerReply ? (
            <ReviewReply reply={review.partnerReply} />
          ) : null}
        </div>
      </div>
    </article>
  );
}
