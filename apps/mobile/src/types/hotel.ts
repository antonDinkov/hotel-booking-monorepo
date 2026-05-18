export type Hotel = {
  id: string;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  amenities: string[];
  roomTypes: string[];
  paymentMethods: string[];
  isFeatured: boolean;
  isFavorite: boolean;
};
