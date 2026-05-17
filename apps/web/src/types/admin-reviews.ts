import type { ReviewModerationStatus } from "@/types/review";

export type AdminReviewSort =
  | "newest"
  | "oldest"
  | "highest_rating"
  | "lowest_rating";

export type AdminReviewReplyFilter = "replied" | "not_replied";

export type AdminReviewFilters = {
  hotelId?: number;
  partnerId?: string;
  rating?: number;
  moderationStatus?: ReviewModerationStatus;
  replyStatus?: AdminReviewReplyFilter;
  dateFrom?: string;
  dateTo?: string;
  sort: AdminReviewSort;
  page: number;
  pageSize: number;
};

export type AdminReviewOption = {
  id: number | string;
  name: string;
};

export type AdminReviewCounts = {
  total: number;
  published: number;
  hidden: number;
  replied: number;
  notReplied: number;
};

export type AdminReviewPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

/**
 * Joined review row displayed in the admin moderation table.
 */
export type AdminReviewListItem = {
  id: number;
  userId: string;
  guestFullName: string;
  guestEmail: string;
  hotelId: number;
  hotelName: string;
  partnerId: string;
  partnerCompanyName: string;
  bookingId: number;
  roomTypeId: number;
  roomTypeName: string;
  rating: number;
  comment: string | null;
  moderationStatus: ReviewModerationStatus;
  partnerReply: string | null;
  partnerRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminReviewListResult = {
  reviews: AdminReviewListItem[];
  hotels: AdminReviewOption[];
  partners: AdminReviewOption[];
  counts: AdminReviewCounts;
  filters: AdminReviewFilters;
  pagination: AdminReviewPagination;
};

/**
 * Full review inspection payload for admin moderation.
 */
export type AdminReviewDetails = AdminReviewListItem & {
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  hotelLocation: string;
  guestPhone: string | null;
};

export type AdminReviewUpdateInput = {
  moderationStatus: ReviewModerationStatus;
};

export type AdminReviewsClientProps = {
  result: AdminReviewListResult;
};

export type AdminReviewDetailClientProps = {
  review: AdminReviewDetails;
};
