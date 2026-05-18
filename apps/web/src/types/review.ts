export type ReviewModerationStatus = "published" | "hidden";

export interface HotelTrustBadge {
  kind: "shining_star";
  label: "Shining Star";
  tooltip: string;
}

/**
 * Server-calculated review metrics for hotel rating displays.
 */
export interface HotelReviewSummary {
  averageRating: number | null;
  reviewCount: number;
  excellentReviewCount: number;
  ratingLabel: string;
  reviewLabel: string;
  trustBadge: HotelTrustBadge | null;
}

export interface CreateReviewRequest {
  bookingId: number;
  rating: number;
  comment?: string | null;
}

export interface PartnerReviewReply {
  comment: string;
  repliedAt: string;
  repliedByName: string | null;
}

export interface Review {
  id: number;
  userId: string;
  hotelId: number;
  bookingId: number;
  rating: number;
  comment: string | null;
  moderationStatus: ReviewModerationStatus;
  partnerReply: PartnerReviewReply | null;
  createdAt: string;
}

export interface HotelReview extends Review {
  userName: string | null;
  userAvatarUrl: string | null;
}

export interface MyReview extends Review {
  userName: string | null;
  userAvatarUrl: string | null;
  hotelName: string;
  hotelLocation: string;
}

/**
 * Review payload shape consumed by reusable review card components.
 */
export interface ReviewCardData extends Review {
  userName?: string | null;
  userAvatarUrl?: string | null;
  hotelName?: string;
  hotelLocation?: string;
}

export interface ReviewPagination {
  limit: number;
  offset: number;
  nextOffset: number | null;
  hasMore: boolean;
}

export interface PaginatedHotelReviews {
  reviews: HotelReview[];
  pagination: ReviewPagination;
}

export interface HotelReviewsPageData extends PaginatedHotelReviews {
  hotel: {
    id: number;
    name: string;
    location: string;
  };
  summary: HotelReviewSummary;
}

export interface MyReviewsPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface MyReviewsPage {
  reviews: MyReview[];
  pagination: MyReviewsPagination;
}
