import type { ComponentType, ReactNode, SVGProps } from "react";

export type AdminBadgeTone = "neutral" | "blue" | "amber" | "red";

export type AdminActionTone = AdminBadgeTone;

export type AdminIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type AdminRouteLayoutProps = {
  children: ReactNode;
};

export type AdminSidebarProps = {
  pathname: string;
  onNavigate?: () => void;
};

export type AdminTopbarProps = {
  pathname: string;
  onMenuClick: () => void;
};

export type AdminNavigationItem = {
  label: string;
  href: string;
  icon: AdminIconComponent;
  activePrefixes: string[];
};

export type AdminSystemIndicator = {
  label: string;
  value: string;
  tone: AdminBadgeTone;
};

export type AdminStatusBadgeProps = {
  label: string;
  tone?: AdminBadgeTone;
};

export type AdminAction = {
  label: string;
  href: string;
  tone?: AdminActionTone;
};

export type AdminActionMenuProps = {
  actions: AdminAction[];
};

export type AdminPanelProps = {
  children: ReactNode;
  className?: string;
};

export type AdminSectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export type AdminStatCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: AdminBadgeTone;
  trend?: string;
  href?: string;
};

export type AdminTableColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  cellClassName?: string;
};

export type AdminTableProps<T> = {
  rows: T[];
  columns: AdminTableColumn<T>[];
  getRowKey: (row: T) => string;
  emptyState?: ReactNode;
};

export type AdminEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export type AdminSearchBarProps = {
  placeholder?: string;
  compact?: boolean;
};

export type AdminFilterOption = {
  label: string;
  href: string;
  active?: boolean;
  count?: number;
  tone?: AdminBadgeTone;
};

export type AdminFiltersProps = {
  label?: string;
  filters: AdminFilterOption[];
};

export type AdminDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export type AdminUserRole = "client" | "partner" | "admin";
export type AdminAccountStatus = "active" | "suspended" | "under_review";
export type AdminModerationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "flagged";
export type AdminPaymentStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded"
  | "disputed";
export type AdminSeverity = "low" | "medium" | "high" | "critical";

/** Static platform user record used by the admin visual scaffold. */
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminAccountStatus;
  joinedAt: string;
  lastActive: string;
  bookings: number;
  reports: number;
  riskScore: number;
};

/** Static partner account record used as the admin ownership root for hotels. */
export type AdminPartner = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  status: AdminAccountStatus;
  verificationStatus: AdminModerationStatus;
  payoutStatus: string;
  joinedAt: string;
  lastActive: string;
  riskScore: number;
  notes: string;
};

/** Static hotel moderation record for table and detail screens. */
export type AdminHotel = {
  id: string;
  name: string;
  city: string;
  ownerId: string;
  ownerName: string;
  approvalStatus: AdminModerationStatus;
  reviewScore: string;
  flags: number;
  rooms: number;
  bookings: number;
  payoutStatus: string;
};

/** Static booking monitoring record with payment and dispute signals. */
export type AdminBooking = {
  id: string;
  userId: string;
  guestName: string;
  hotelId: string;
  hotelName: string;
  dates: string;
  status: string;
  paymentStatus: AdminPaymentStatus;
  amount: string;
  disputeStatus: string;
  riskSignal: string;
};

/** Static review case used by the moderation queue. */
export type AdminReviewCase = {
  id: string;
  userId: string;
  userName: string;
  hotelId: string;
  hotelName: string;
  rating: number;
  status: "reported" | "low_rating" | "hidden" | "pending";
  reportCount: number;
  excerpt: string;
  createdAt: string;
};

/** Static abuse report record for the issues center. */
export type AdminReport = {
  id: string;
  type: "hotel" | "user" | "review";
  subjectId: string;
  subjectLabel: string;
  severity: AdminSeverity;
  status: "open" | "triaged" | "escalated" | "resolved";
  reason: string;
  createdAt: string;
  assignedTo: string;
};

/** Static payment operation record for financial monitoring screens. */
export type AdminPayment = {
  id: string;
  bookingId: string;
  hotelId: string;
  partnerName: string;
  amount: string;
  status: AdminPaymentStatus;
  type: "charge" | "refund" | "payout" | "dispute";
  createdAt: string;
  risk: string;
};

export type AdminAnalyticsMetric = {
  title: string;
  value: string;
  caption: string;
  tone: AdminBadgeTone;
  bars: number[];
};

export type AdminSystemCheck = {
  name: string;
  status: string;
  detail: string;
  updatedAt: string;
  tone: AdminBadgeTone;
};

export type AdminAuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  severity: AdminSeverity;
};

export type AdminModerationAction = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  outcome: string;
};

export type AdminRoomSnapshot = {
  id: string;
  hotelId: string;
  name: string;
  status: AdminModerationStatus;
  nightlyRate: string;
  occupancy: string;
  flags: number;
};
