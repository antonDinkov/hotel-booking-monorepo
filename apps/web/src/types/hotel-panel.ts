export type SearchFieldIcon = "pin" | "calendar" | "guests";

export interface Brand {
  name: string;
}

export interface Navigation {
  primaryAction: string;
  secondaryAction: string;
}

export interface HeroImage {
  src: string;
  alt: string;
}

export interface Hero {
  eyebrow: string;
  title: string;
  description: string;
  image: HeroImage;
}

export interface SearchField {
  label: string;
  placeholder: string;
  icon: SearchFieldIcon;
}

export interface ListingImage {
  src: string;
  alt: string;
}

export interface Listing {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewLabel: string;
  image: ListingImage;
}

export interface Amenity {
  icon: string;
  name: string;
}

export interface ListingDetails extends Listing {
  description: string;
  price: number;
  pricePerNight: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  amenities: Amenity[];
  images: ListingImage[];
  highlights: string[];
}

export interface FeaturedHeading {
  title: string;
  subtitle: string;
}

export interface Footer {
  text: string;
}

export interface HotelPanelData {
  brand: Brand;
  navigation: Navigation;
  hero: Hero;
  search: {
    cta: string;
  };
  searchFields: SearchField[];
  featuredHeading: FeaturedHeading;
  featuredListings: Listing[];
  footer: Footer;
}