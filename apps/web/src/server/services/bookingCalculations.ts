import { parseDateOnly } from "@/lib/date-only";

export { formatDateOnly, isDateOnly, parseDateOnly } from "@/lib/date-only";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getBookingRoomsCount(value: number | null | undefined): number {
  return value && value > 0 ? value : 1;
}

export function calculateBookingNights(
  checkInDate: string,
  checkOutDate: string
): number {
  const checkIn = parseDateOnly(checkInDate);
  const checkOut = parseDateOnly(checkOutDate);
  const difference = checkOut.getTime() - checkIn.getTime();
  return Math.max(0, Math.round(difference / MS_PER_DAY));
}

export function calculateBookingTotal(input: {
  pricePerNight: number;
  roomsCount: number | null | undefined;
  checkInDate: string;
  checkOutDate: string;
}): number {
  const nights = Math.max(
    1,
    calculateBookingNights(input.checkInDate, input.checkOutDate)
  );

  return input.pricePerNight * nights * getBookingRoomsCount(input.roomsCount);
}
