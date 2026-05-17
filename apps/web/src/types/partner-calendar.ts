import type {
  BookingPaymentMethod,
  BookingPaymentStatus,
} from "@/types/booking";

export type PartnerCalendarView = "monthly" | "weekly";
export type PartnerCalendarBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PartnerCalendarAvailabilityStatus =
  | "available"
  | "partial"
  | "full";

export type PartnerCalendarFilters = {
  hotelId?: number;
  roomTypeId?: number;
  status?: PartnerCalendarBookingStatus;
  dateFrom: string;
  dateTo: string;
  view: PartnerCalendarView;
};

export type PartnerCalendarHotelOption = {
  id: number;
  name: string;
};

export type PartnerCalendarRoomTypeOption = {
  id: number;
  hotelId: number;
  hotelName: string;
  name: string;
};

export type PartnerCalendarBookingRow = {
  bookingId: number;
  userEmail: string;
  guestFullName: string | null;
  hotelId: number;
  hotelName: string;
  roomTypeId: number;
  roomTypeName: string;
  totalRooms: number;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  roomsCount: number | null;
  status: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
};

export type PartnerCalendarRoomTypeRow = {
  roomTypeId: number;
  roomTypeName: string;
  hotelId: number;
  hotelName: string;
  totalRooms: number;
};

/**
 * Calendar reservation event shown in the partner availability grid.
 */
export type PartnerCalendarEvent = {
  bookingId: number;
  guestFullName: string;
  hotelId: number;
  hotelName: string;
  roomTypeId: number;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  roomsCount: number;
  status: PartnerCalendarBookingStatus;
  paymentMethod: BookingPaymentMethod | null;
  paymentStatus: BookingPaymentStatus;
};

export type PartnerCalendarAvailabilityCell = {
  date: string;
  bookedRooms: number;
  availableRooms: number;
  totalRooms: number;
  status: PartnerCalendarAvailabilityStatus;
};

export type PartnerCalendarRow = {
  roomTypeId: number;
  roomTypeName: string;
  hotelId: number;
  hotelName: string;
  totalRooms: number;
  availability: PartnerCalendarAvailabilityCell[];
  events: PartnerCalendarEvent[];
};

export type PartnerCalendarResult = {
  dates: string[];
  rows: PartnerCalendarRow[];
  events: PartnerCalendarEvent[];
  hotels: PartnerCalendarHotelOption[];
  roomTypes: PartnerCalendarRoomTypeOption[];
  filters: PartnerCalendarFilters;
};

export type PartnerCalendarAvailabilityResult = Pick<
  PartnerCalendarResult,
  "dates" | "rows" | "filters"
>;

export type PartnerCalendarPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export type PartnerCalendarClientProps = {
  initialResult: PartnerCalendarResult;
};
