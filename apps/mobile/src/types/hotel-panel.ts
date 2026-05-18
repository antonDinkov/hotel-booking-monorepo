export type SearchFieldIcon = 'pin' | 'calendar' | 'guests' | 'map-pin';

export type HotelTrustBadge = {
  kind: 'shining_star';
  label: 'Shining Star';
  tooltip: string;
};

export type SearchField = {
  icon: SearchFieldIcon;
  label: string;
  placeholder: string;
};

export type ListingImage = {
  alt: string;
  src: string;
};

export type Listing = {
  category: string;
  id: string;
  image: ListingImage;
  isFeatured?: boolean;
  minPrice?: number | null;
  name: string;
  rating: number | null;
  ratingLabel?: string;
  reviewLabel: string;
  trustBadge?: HotelTrustBadge | null;
};

export type Amenity = {
  icon: string;
  name: string;
};

export type ListingDetails = Listing & {
  amenities: Amenity[];
  description: string;
  highlights: string[];
  images: ListingImage[];
  location: string;
  price: number;
  pricePerNight: string;
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

export type HotelPanelData = {
  brand: { name: string };
  featuredHeading: {
    subtitle: string;
    title: string;
  };
  featuredListings: Listing[];
  search: { cta: string };
  searchFields: SearchField[];
};

export type SearchHotelsInput = {
  checkInDate: string;
  checkOutDate: string;
  destination: string;
  guests: string;
};
