import type { AdminPagination } from "@/types/admin";
import type { AdminPartnerVerificationStatus } from "@/types/admin-partners";

export type AdminUserRoleFilter = "client" | "partner" | "admin";
export type AdminUserActiveFilter = "active" | "inactive";
export type AdminUserSort = "newest" | "oldest" | "email" | "role";

export type AdminUserListFilters = {
  role?: AdminUserRoleFilter;
  active?: AdminUserActiveFilter;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  sort: AdminUserSort;
  page: number;
  pageSize: number;
};

export type AdminUserFilterCounts = {
  total: number;
  clients: number;
  partners: number;
  admins: number;
  active: number;
  inactive: number;
};

export type AdminUserListItem = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  roles: string[];
  isActive: boolean;
  createdAt: string | null;
  bookingsCount: number;
  reviewsCount: number;
};

export type AdminUserListResult = {
  users: AdminUserListItem[];
  filters: AdminUserListFilters;
  pagination: AdminPagination;
  counts: AdminUserFilterCounts;
};

export type AdminUserUpdateInput = {
  isActive: boolean;
};

export type AdminUserProfileDetails = {
  fullName: string | null;
  phone: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  city: string | null;
  country: string | null;
};

export type AdminUserBookingSummary = {
  id: number;
  hotelId: number | null;
  hotelName: string | null;
  roomTypeName: string | null;
  checkInDate: string;
  checkOutDate: string;
  status: string | null;
  paymentStatus: string | null;
  createdAt: string | null;
};

export type AdminUserReviewSummary = {
  id: number;
  hotelId: number;
  hotelName: string | null;
  rating: number;
  moderationStatus: string;
  commentPreview: string;
  createdAt: string | null;
};

export type AdminUserPartnerProfile = {
  id: string;
  companyName: string;
  representativeName: string;
  email: string;
  phone: string | null;
  website: string | null;
  verificationStatus: AdminPartnerVerificationStatus;
  isVerified: boolean;
  hotelsCount: number;
  bookingsCount: number;
  reviewsCount: number;
};

export type AdminUserDetails = {
  account: AdminUserListItem;
  profile: AdminUserProfileDetails;
  bookings: AdminUserBookingSummary[];
  reviews: AdminUserReviewSummary[];
  partnerProfile: AdminUserPartnerProfile | null;
};

export type AdminUsersClientProps = {
  result: AdminUserListResult;
};

export type AdminUserDetailClientProps = {
  user: AdminUserDetails;
};

