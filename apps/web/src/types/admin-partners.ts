import type { AdminPagination } from "@/types/admin";

export type AdminPartnerVerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "suspended";

export type AdminPartnerVerifiedFilter = "verified" | "unverified";
export type AdminPartnerSort =
  | "newest"
  | "oldest"
  | "company"
  | "verification";

export type AdminPartnerListFilters = {
  verificationStatus?: AdminPartnerVerificationStatus;
  verified?: AdminPartnerVerifiedFilter;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  sort: AdminPartnerSort;
  page: number;
  pageSize: number;
};

export type AdminPartnerFilterCounts = {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  suspended: number;
  verifiedProfiles: number;
  unverifiedProfiles: number;
};

export type AdminPartnerStats = {
  hotelsCount: number;
  bookingsCount: number;
  reviewsCount: number;
};

export type AdminPartnerListItem = AdminPartnerStats & {
  id: string;
  userId: string;
  companyName: string;
  representativeName: string;
  email: string;
  phone: string | null;
  website: string | null;
  verificationStatus: AdminPartnerVerificationStatus;
  isVerified: boolean;
  createdAt: string | null;
};

export type AdminPartnerListResult = {
  partners: AdminPartnerListItem[];
  filters: AdminPartnerListFilters;
  pagination: AdminPagination;
  counts: AdminPartnerFilterCounts;
};

export type AdminPartnerUpdateInput = {
  verificationStatus: AdminPartnerVerificationStatus;
};

export type AdminPartnerLinkedUser = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string | null;
};

export type AdminPartnerHotelSummary = {
  id: number;
  name: string;
  location: string;
  registeredAt: string | null;
  bookingsCount: number;
  reviewsCount: number;
};

export type AdminPartnerBookingSummary = {
  id: number;
  userId: string;
  guestName: string;
  guestEmail: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  status: string | null;
  paymentStatus: string | null;
  createdAt: string | null;
};

export type AdminPartnerReviewSummary = {
  id: number;
  userId: string;
  reviewerName: string;
  reviewerEmail: string;
  hotelName: string | null;
  rating: number;
  moderationStatus: string;
  commentPreview: string;
  createdAt: string | null;
};

export type AdminPartnerDetails = {
  partner: AdminPartnerListItem & {
    representativeFirstName: string;
    representativeLastName: string;
    position: string;
    companyAddress: string | null;
    vatNumber: string | null;
    updatedAt: string | null;
  };
  linkedUser: AdminPartnerLinkedUser;
  hotels: AdminPartnerHotelSummary[];
  bookings: AdminPartnerBookingSummary[];
  reviews: AdminPartnerReviewSummary[];
};

export type AdminPartnersClientProps = {
  result: AdminPartnerListResult;
};

export type AdminPartnerDetailClientProps = {
  partner: AdminPartnerDetails;
};

