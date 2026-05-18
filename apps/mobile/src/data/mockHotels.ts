import type { Hotel } from '@/types/hotel';

export const hotels: Hotel[] = [
  {
    id: 'hotel-1',
    name: 'Azure Bay Hotel',
    location: 'Nessebar, Bulgaria',
    description: 'A bright seaside stay with spacious rooms, breakfast terraces, and quick access to the old town.',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    rating: 4.8,
    reviewCount: 248,
    pricePerNight: 142,
    amenities: ['Sea view', 'Breakfast', 'Pool', 'Airport transfer'],
    roomTypes: ['Deluxe King', 'Family Suite', 'Sea View Twin'],
    paymentMethods: ['Stripe Checkout', 'Cash on arrival'],
    isFeatured: true,
    isFavorite: true,
  },
  {
    id: 'hotel-2',
    name: 'City Garden Suites',
    location: 'Sofia, Bulgaria',
    description: 'Calm apartment-style suites near parks, museums, and business districts.',
    imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
    rating: 4.6,
    reviewCount: 181,
    pricePerNight: 118,
    amenities: ['Kitchenette', 'Workspace', 'Parking', 'Late checkout'],
    roomTypes: ['Studio Suite', 'Executive Suite'],
    paymentMethods: ['Stripe Checkout'],
    isFeatured: true,
    isFavorite: false,
  },
  {
    id: 'hotel-3',
    name: 'Pine Ridge Lodge',
    location: 'Bansko, Bulgaria',
    description: 'A cozy mountain base with warm interiors, ski storage, and family-friendly dining.',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    rating: 4.7,
    reviewCount: 132,
    pricePerNight: 96,
    amenities: ['Ski storage', 'Sauna', 'Restaurant', 'Shuttle'],
    roomTypes: ['Mountain Double', 'Family Maisonette'],
    paymentMethods: ['Cash on arrival'],
    isFeatured: false,
    isFavorite: true,
  },
];

export function getHotelById(id: string): Hotel | undefined {
  return hotels.find((hotel) => hotel.id === id);
}

export function getFavoriteHotels(): Hotel[] {
  return hotels.filter((hotel) => hotel.isFavorite);
}
