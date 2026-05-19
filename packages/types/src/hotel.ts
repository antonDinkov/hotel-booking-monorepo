import type { HotelTrustBadge } from "./review";

export type SearchFieldIcon = "pin" | "calendar" | "guests" | "map-pin";

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

export type Brand = {
  name: string;
};

export type Navigation = {
  primaryAction: string;
  secondaryAction: string;
};

export type HeroImage = {
  src: string;
  alt: string;
};

export type Hero = {
  eyebrow: string;
  title: string;
  description: string;
  image: HeroImage;
};

export type SearchField = {
  label: string;
  placeholder: string;
  icon: SearchFieldIcon;
};

export type ListingImage = {
  src: string;
  alt: string;
};

export type Listing = {
  id: string;
  name: string;
  category: string;
  rating: number | null;
  ratingLabel?: string;
  reviewLabel: string;
  trustBadge?: HotelTrustBadge | null;
  image: ListingImage;
  isFeatured?: boolean;
  minPrice?: number | null;
};

export type Amenity = {
  icon: string;
  name: string;
};

export type ListingDetails = Listing & {
  description: string;
  price: number;
  pricePerNight: string;
  location: string;
  amenities: Amenity[];
  images: ListingImage[];
  highlights: string[];
};

export type ListingSearchPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ListingSearchResult = {
  listings: Listing[];
  pagination: ListingSearchPagination;
};

export type FeaturedHeading = {
  title: string;
  subtitle: string;
};

export type Footer = {
  text: string;
};

export type HotelPanelData = {
  brand: Brand;
  navigation: Navigation;
  hero: Hero;
  search: {
    cta: string;
  };
  searchFields: SearchField[];
  featuredHeading: FeaturedHeading;
  featuredListings: Listing[];
};

export type SearchHotelsInput = {
  checkInDate: string;
  checkOutDate: string;
  destination: string;
  guests: string;
};
