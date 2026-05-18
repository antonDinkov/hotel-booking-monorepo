export type Review = {
  id: string;
  hotelId: string;
  hotelName: string;
  rating: number;
  comment: string;
  createdAt: string;
  moderationStatus: 'published' | 'hidden';
  partnerReply?: string;
};
