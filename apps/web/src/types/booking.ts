export type BookingStatus = "upcoming" | "active" | "past";

export interface MyBooking {
  id: string;
  hotelName: string;
  hotelAddress?: string;
  hotelImage?: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: BookingStatus;
  daysRemaining?: number;
}

