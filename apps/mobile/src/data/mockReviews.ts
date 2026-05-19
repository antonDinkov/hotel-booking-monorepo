import type { ReviewCardData } from '@repo/types';

export const reviews: ReviewCardData[] = [
  {
    id: 1,
    userId: 'demo-client',
    hotelId: 2,
    bookingId: 1,
    hotelName: 'City Garden Suites',
    rating: 5,
    comment: 'Quiet room, helpful reception, and easy transport to the center.',
    createdAt: '2026-04-25',
    moderationStatus: 'published',
    partnerReply: {
      comment: 'Thank you for staying with us. We are glad the location worked well for your trip.',
      repliedAt: '2026-04-26',
      repliedByName: 'City Garden Suites',
    },
  },
  {
    id: 2,
    userId: 'demo-client',
    hotelId: 1,
    bookingId: 2,
    hotelName: 'Azure Bay Hotel',
    rating: 4,
    comment: 'Great breakfast and views. Check-in was quick even during a busy weekend.',
    createdAt: '2026-03-18',
    moderationStatus: 'published',
    partnerReply: null,
  },
];
