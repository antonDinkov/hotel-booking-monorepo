import type { ReactNode } from "react";

export type PartnerBadgeTone =
  | "amber"
  | "emerald"
  | "indigo"
  | "rose"
  | "slate";

export type PartnerRouteLayoutProps = {
  children: ReactNode;
};

export type PartnerCardProps = {
  children: ReactNode;
  className?: string;
};

export type PartnerPageHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
};

export type PartnerSectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export type PartnerStatCardProps = {
  label: string;
  value: string;
  detail: string;
  trend?: string;
  icon: ReactNode;
  tone?: PartnerBadgeTone;
};

export type PartnerBadgeProps = {
  children: ReactNode;
  tone?: PartnerBadgeTone;
};

export type PartnerEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export type PartnerFormSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export type PartnerChartPlaceholderProps = {
  title: string;
  value: string;
  caption: string;
  bars?: number[];
  badgeLabel?: string;
};

export type PartnerHotelFormProps = {
  mode: "new" | "edit";
  hotelId?: string;
};

export type PartnerRoomFormProps = {
  roomId: string;
};

export type PartnerHotelPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export type PartnerRoomPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export type PartnerBookingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export type PartnerQuickAction = {
  label: string;
  description: string;
  href: string;
};

export type PartnerStat = {
  label: string;
  value: string;
  detail: string;
  trend: string;
  tone: PartnerBadgeTone;
};

export type PartnerHotel = {
  id: string;
  name: string;
  city: string;
  address: string;
  status: "Active" | "Draft" | "Paused";
  rating: string;
  rooms: number;
  occupancy: string;
  revenue: string;
  amenities: string[];
  policySummary: string;
  payoutStatus: string;
  checkIn: string;
  checkOut: string;
};

export type PartnerRoom = {
  id: string;
  hotelId: string;
  name: string;
  type: string;
  rate: string;
  occupancy: string;
  status: "Available" | "Limited" | "Disabled";
  capacity: string;
  size: string;
  beds: string;
  imageCount: number;
};

export type PartnerBooking = {
  id: string;
  guest: string;
  guestEmail: string;
  guestPhone: string;
  hotelId: string;
  hotel: string;
  room: string;
  dates: string;
  payment: string;
  paymentStatus: "Paid" | "Pending" | "Refunded";
  status: "Upcoming" | "Completed" | "Cancelled";
  total: string;
  checkInTime: string;
  notes: string;
};

export type PartnerReview = {
  id: string;
  guest: string;
  hotel: string;
  rating: number;
  date: string;
  comment: string;
  status: "Unanswered" | "Replied";
};

export type PartnerNotification = {
  id: string;
  type: "New booking" | "Cancellation" | "New review" | "Payout";
  title: string;
  detail: string;
  time: string;
  href: string;
  tone: PartnerBadgeTone;
};

export type PartnerAnalyticsMetric = {
  title: string;
  value: string;
  caption: string;
  bars: number[];
};

export type PartnerCalendarBlock = {
  start: number;
  span: number;
  label: string;
  tone: PartnerBadgeTone;
};

export type PartnerCalendarRow = {
  room: string;
  hotel: string;
  blocks: PartnerCalendarBlock[];
};
