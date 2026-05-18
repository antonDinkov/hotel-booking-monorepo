import type { Review } from '@/types/review';

export const reviews: Review[] = [
  {
    id: 'review-1',
    hotelId: 'hotel-2',
    hotelName: 'City Garden Suites',
    rating: 5,
    comment: 'Quiet room, helpful reception, and easy transport to the center.',
    createdAt: '2026-04-25',
    moderationStatus: 'published',
    partnerReply: 'Thank you for staying with us. We are glad the location worked well for your trip.',
  },
  {
    id: 'review-2',
    hotelId: 'hotel-1',
    hotelName: 'Azure Bay Hotel',
    rating: 4,
    comment: 'Great breakfast and views. Check-in was quick even during a busy weekend.',
    createdAt: '2026-03-18',
    moderationStatus: 'published',
  },
];
