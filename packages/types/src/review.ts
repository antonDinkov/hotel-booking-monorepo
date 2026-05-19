export type ReviewModerationStatus = "published" | "hidden";

export type HotelTrustBadge = {
  kind: "shining_star";
  label: "Shining Star";
  tooltip: string;
};

export type HotelReviewSummary = {
  averageRating: number | null;
  reviewCount: number;
  excellentReviewCount: number;
  ratingLabel: string;
  reviewLabel: string;
  trustBadge: HotelTrustBadge | null;
};

export type CreateReviewRequest = {
  bookingId: number;
  rating: number;
  comment?: string | null;
};

export type PartnerReviewReply = {
  comment: string;
  repliedAt: string;
  repliedByName: string | null;
};

export type Review = {
  id: number;
  userId: string;
  hotelId: number;
  bookingId: number;
  rating: number;
  comment: string | null;
  moderationStatus: ReviewModerationStatus;
  partnerReply: PartnerReviewReply | null;
  createdAt: string;
};

export type HotelReview = Review & {
  userName: string | null;
  userAvatarUrl: string | null;
};

export type MyReview = Review & {
  userName: string | null;
  userAvatarUrl: string | null;
  hotelName: string;
  hotelLocation: string;
};

export type ReviewCardData = Review & {
  userName?: string | null;
  userAvatarUrl?: string | null;
  hotelName?: string;
  hotelLocation?: string;
};

export type ReviewPagination = {
  limit: number;
  offset: number;
  nextOffset: number | null;
  hasMore: boolean;
};

export type PaginatedHotelReviews = {
  reviews: HotelReview[];
  pagination: ReviewPagination;
};

export type HotelReviewsPageData = PaginatedHotelReviews & {
  hotel: {
    id: number;
    name: string;
    location: string;
  };
  summary: HotelReviewSummary;
};

export type MyReviewsPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type MyReviewsPage = {
  reviews: MyReview[];
  pagination: MyReviewsPagination;
};
