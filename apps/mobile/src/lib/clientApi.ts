import { fetchApi } from '@/lib/api';
import type { ClientBookingsPage } from '@/types/booking';
import type { HotelPanelData, ListingSearchResult, SearchHotelsInput } from '@/types/hotel-panel';
import type { HotelAvailabilityResult } from '@/types/room-availability';

type ApiResponse<T> = { data: T };
type FavoriteIdsPayload = { hotelIds: number[] };
type ReviewsCountPayload = { pagination?: { totalItems?: number }; reviews?: unknown[] };

export async function getHotelPanelData(): Promise<HotelPanelData> {
  const payload = await fetchApi<HotelPanelData | ApiResponse<HotelPanelData>>('/api/hotel-panel');
  return hasData(payload) ? payload.data : payload;
}

export async function searchHotels(
  input: SearchHotelsInput,
  page = 1,
  pageSize = 6,
): Promise<ListingSearchResult> {
  const params = new URLSearchParams({
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    destination: input.destination.trim(),
    guests: input.guests,
    page: String(page),
    pageSize: String(pageSize),
  });
  const payload = await fetchApi<ApiResponse<ListingSearchResult>>(`/api/search?${params.toString()}`);
  return payload.data;
}

export async function getClientBookingsPage(page = 1, pageSize = 10): Promise<ClientBookingsPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const payload = await fetchApi<ApiResponse<ClientBookingsPage>>(`/api/bookings?${params.toString()}`);
  return payload.data;
}

export async function getFavoriteHotelIds(): Promise<number[]> {
  const payload = await fetchApi<ApiResponse<FavoriteIdsPayload>>('/api/favorites?ids=1');
  return payload.data.hotelIds;
}

export async function getMyReviewsCount(): Promise<number> {
  const payload = await fetchApi<ApiResponse<ReviewsCountPayload>>('/api/reviews/me?page=1&pageSize=1');
  return payload.data.pagination?.totalItems ?? payload.data.reviews?.length ?? 0;
}

export async function getHotelAvailability(
  hotelId: string,
  input: Pick<SearchHotelsInput, 'checkInDate' | 'checkOutDate' | 'guests'>,
): Promise<HotelAvailabilityResult> {
  const params = new URLSearchParams({
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    guests: input.guests,
  });
  const payload = await fetchApi<ApiResponse<HotelAvailabilityResult>>(
    `/api/hotels/${hotelId}/availability?${params.toString()}`,
  );
  return payload.data;
}

function hasData<T>(payload: T | ApiResponse<T>): payload is ApiResponse<T> {
  return typeof payload === 'object' && payload !== null && 'data' in payload;
}
