import type { ReviewModerationStatus } from "@/types/review";

export type PartnerReviewSort =
  | "newest"
  | "oldest"
  | "highest_rating"
  | "lowest_rating";

export type PartnerReviewReplyFilter = "replied" | "not_replied";
export type PartnerReviewReplyStatus = PartnerReviewReplyFilter;

export type PartnerReviewFilters = {
  hotelId?: number;
  rating?: number;
  moderationStatus?: ReviewModerationStatus;
  replyStatus?: PartnerReviewReplyFilter;
  dateFrom?: string;
  dateTo?: string;
  sort: PartnerReviewSort;
  page: number;
  pageSize: number;
};

export type PartnerReviewHotelOption = {
  id: number;
  name: string;
};

export type PartnerReviewPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

/**
 * Joined review row selected by the partner review service.
 */
export type PartnerReviewRow = {
  id: number;
  userId: string;
  userEmail: string;
  guestFullName: string | null;
  guestPhone: string | null;
  hotelId: number;
  hotelName: string;
  hotelLocation: string;
  roomTypeId: number;
  roomTypeName: string;
  bookingId: number;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  rating: number;
  comment: string | null;
  moderationStatus: string;
  partnerReply: string | null;
  partnerRepliedAt: Date | string | null;
  partnerRepliedBy: string | null;
  partnerRepliedByName: string | null;
  createdAt: Date | string;
};

/**
 * Review row displayed in the partner review management list.
 */
export type PartnerReviewListItem = {
  id: number;
  userId: string;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string | null;
  hotelId: number;
  hotelName: string;
  hotelLocation: string;
  roomTypeId: number;
  roomTypeName: string;
  bookingId: number;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  rating: number;
  comment: string | null;
  moderationStatus: ReviewModerationStatus;
  partnerReply: string | null;
  partnerReplyStatus: PartnerReviewReplyStatus;
  partnerRepliedAt: string | null;
  partnerRepliedBy: string | null;
  partnerRepliedByName: string | null;
  createdAt: string;
};

/**
 * Full owned-review detail payload exposed through the partner review API.
 */
export type PartnerReviewDetails = PartnerReviewListItem & {
  imageUrl: string | null;
};

export type PartnerReviewListResult = {
  reviews: PartnerReviewListItem[];
  hotels: PartnerReviewHotelOption[];
  filters: PartnerReviewFilters;
  pagination: PartnerReviewPagination;
};

export type PartnerReviewReplyInput = {
  partnerReply: string;
};

export type PartnerReviewReplyPayload = {
  data?: PartnerReviewDetails;
  error?: {
    message?: string;
    code?: string;
  };
};

export type PartnerReviewActionNotice = {
  tone: "success" | "error";
  message: string;
};

export type PartnerReviewsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export type PartnerReviewsClientProps = {
  initialResult: PartnerReviewListResult;
};

export type PartnerReviewApiRouteContext = {
  params: Promise<{
    id: string;
  }>;
};
