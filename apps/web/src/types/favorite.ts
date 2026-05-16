import type { Listing } from "./hotel-panel";

export interface FavoritePaginationInput {
  limit?: number;
  offset?: number;
}

export interface FavoritePagination {
  limit: number;
  offset: number;
  nextOffset: number | null;
  hasMore: boolean;
}

/** Page payload for the current client's saved hotel listing. */
export interface SavedHotelsPage {
  hotels: Listing[];
  pagination: FavoritePagination;
  total: number;
}

export interface FavoriteHotelIds {
  hotelIds: number[];
}

export interface FavoriteMutationResult {
  hotelId: number;
  isFavorite: boolean;
}
