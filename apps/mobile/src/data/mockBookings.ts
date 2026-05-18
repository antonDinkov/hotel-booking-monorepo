import type { MyBooking } from '@/types/booking';

export const bookings: MyBooking[] = [
  {
    id: 'booking-1001',
    hotelId: 1,
    hotelName: 'Azure Bay Hotel',
    hotelAddress: 'Nessebar, Bulgaria',
    roomType: 'Sea View Twin',
    checkIn: '2026-06-12',
    checkOut: '2026-06-16',
    status: 'upcoming',
    lifecycleStatus: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'stripe',
    totalPrice: 568,
    canCancel: true,
  },
  {
    id: 'booking-1002',
    hotelId: 3,
    hotelName: 'Pine Ridge Lodge',
    hotelAddress: 'Bansko, Bulgaria',
    roomType: 'Mountain Double',
    checkIn: '2026-08-05',
    checkOut: '2026-08-07',
    status: 'upcoming',
    lifecycleStatus: 'confirmed',
    paymentStatus: 'pending',
    paymentMethod: 'cash_on_arrival',
    totalPrice: 192,
    canCancel: true,
  },
  {
    id: 'booking-1003',
    hotelId: 2,
    hotelName: 'City Garden Suites',
    hotelAddress: 'Sofia, Bulgaria',
    roomType: 'Executive Suite',
    checkIn: '2026-04-20',
    checkOut: '2026-04-23',
    status: 'past',
    lifecycleStatus: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'stripe',
    totalPrice: 354,
    canReview: true,
  },
];

export function getBookingById(id: string): MyBooking | undefined {
  return bookings.find((booking) => booking.id === id);
}
