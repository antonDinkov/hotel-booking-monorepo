import type { ListingDetails } from "../types/hotel-panel";
import rawDetailsData from "./hotel-details.json";

type RawListingDetails = Omit<ListingDetails, "image"> & {
  image: { src: string; alt: string };
};

const detailsMap = new Map<string, ListingDetails>();

rawDetailsData.listings.forEach((listing: RawListingDetails) => {
  detailsMap.set(listing.id, listing);
});

export function getListingDetails(id: string): ListingDetails | null {
  return detailsMap.get(id) ?? null;
}

export function getAllListingIds(): string[] {
  return Array.from(detailsMap.keys());
}
