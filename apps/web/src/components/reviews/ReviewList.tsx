import type { ReviewCardData } from "@/types/review";
import ReviewCard from "./ReviewCard";

interface ReviewListProps {
  reviews: ReviewCardData[];
  mode?: "compact" | "full";
  showHotelInfo?: boolean;
  showPartnerReply?: boolean;
  emptyMessage?: string;
}

export default function ReviewList({
  reviews,
  mode = "full",
  showHotelInfo = false,
  showPartnerReply = true,
  emptyMessage = "No reviews yet.",
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          mode={mode}
          showHotelInfo={showHotelInfo}
          showPartnerReply={showPartnerReply}
        />
      ))}
    </div>
  );
}
