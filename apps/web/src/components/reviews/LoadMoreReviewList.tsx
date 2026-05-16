"use client";

import { useState } from "react";

import { AppButton } from "@/components/AppButton";
import type { HotelReview, PaginatedHotelReviews, ReviewPagination } from "@/types/review";
import ReviewList from "./ReviewList";

interface LoadMoreReviewListProps {
  hotelId: number;
  initialReviews: HotelReview[];
  initialPagination: ReviewPagination;
}

type ReviewsPayload = {
  data?: PaginatedHotelReviews;
  error?: {
    message?: string;
  };
};

export default function LoadMoreReviewList({
  hotelId,
  initialReviews,
  initialPagination,
}: LoadMoreReviewListProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShowMore = async () => {
    if (isLoading || pagination.nextOffset === null) return;

    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      hotelId: String(hotelId),
      limit: String(pagination.limit),
      offset: String(pagination.nextOffset),
    });

    try {
      const response = await fetch(`/api/reviews?${params.toString()}`);
      const payload = await response.json().catch(() => null) as ReviewsPayload | null;
      const data = payload?.data;

      if (!response.ok || !data) {
        throw new Error(payload?.error?.message ?? "Unable to load more reviews.");
      }

      setReviews((current) => [...current, ...data.reviews]);
      setPagination(data.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load more reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ReviewList reviews={reviews} emptyMessage="No reviews yet." />

      {error ? (
        <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {pagination.hasMore ? (
        <div className="mt-6 flex justify-center">
          <AppButton variant="secondary" size="md" onClick={handleShowMore} disabled={isLoading}>
            {isLoading ? "Loading..." : "Show more"}
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}
