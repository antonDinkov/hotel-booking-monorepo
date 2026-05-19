import { fetchApi, getApiBaseUrl } from '@/lib/api';
import type {
    ApiResponse,
    BookingSummary,
    CancelBookingResult,
    ClientBookingsPage,
    CreateBookingHoldRequest,
    CreateBookingHoldResponse,
    HotelAvailabilityResult,
    HotelPanelData,
    ListingDetails,
    ListingSearchResult,
    ProfileData,
    ProfileDataWithAvatarUrl,
    SearchHotelsInput,
    StripeCheckoutPayload,
} from '@repo/types';

type FavoriteIdsPayload = { hotelIds: number[] };
type ReviewsCountPayload = { pagination?: { totalItems?: number }; reviews?: unknown[] };
type ReviewPayload = {
    bookingId: number;
    comment: string | null;
    createdAt: string;
    hotelId: number;
    id: number;
    moderationStatus: string;
    rating: number;
    userId: string;
};

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

/* export async function getClientBookingsPage(page = 1, pageSize = 10): Promise<ClientBookingsPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const payload = await fetchApi<ApiResponse<ClientBookingsPage>>(`/api/bookings?${params.toString()}`);
  return payload.data;
} */
export async function getClientBookingsPage(page = 1, pageSize = 10): Promise<ClientBookingsPage> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

    const payload = await fetchApi<ApiResponse<ClientBookingsPage>>(
        `/api/bookings?${params.toString()}`
    );

    return {
        activeBooking: payload.data?.activeBooking ?? null,
        inactiveBookings: payload.data?.inactiveBookings ?? [],
        pagination: payload.data?.pagination ?? {
            page,
            pageSize,
            totalItems: 0,
            totalPages: 1,
        },
    };
}

export async function cancelBooking(bookingId: string): Promise<CancelBookingResult> {
    const payload = await fetchApi<ApiResponse<CancelBookingResult>>(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
    });
    return payload.data;
}

export async function submitBookingReview(input: {
    bookingId: string;
    comment: string;
    rating: number;
}): Promise<ReviewPayload> {
    const payload = await fetchApi<ApiResponse<ReviewPayload>>('/api/reviews', {
        body: JSON.stringify({
            bookingId: Number(input.bookingId),
            comment: input.comment.trim() || null,
            rating: input.rating,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
    });
    return payload.data;
}

export async function createPendingBookingHold(
    input: CreateBookingHoldRequest,
): Promise<CreateBookingHoldResponse> {
    const payload = await fetchApi<ApiResponse<CreateBookingHoldResponse>>('/api/bookings', {
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
    });
    return payload.data;
}

export async function getBookingSummary(bookingId: string): Promise<BookingSummary> {
    const payload = await fetchApi<ApiResponse<BookingSummary>>(`/api/bookings/${bookingId}`);
    return payload.data;
}

export async function confirmCashOnArrival(bookingId: string): Promise<{ bookingId: number }> {
    const payload = await fetchApi<ApiResponse<{ bookingId: number }>>(`/api/bookings/${bookingId}/cash-on-arrival`, {
        method: 'POST',
    });
    return payload.data;
}

export async function startStripeCheckout(bookingId: string): Promise<StripeCheckoutPayload> {
    const payload = await fetchApi<ApiResponse<StripeCheckoutPayload>>(`/api/bookings/${bookingId}/stripe-checkout`, {
        method: 'POST',
    });
    return payload.data;
}

export async function startStripeCheckoutWithReturnTo(
    bookingId: string,
    returnTo: string,
): Promise<StripeCheckoutPayload> {
    const payload = await fetchApi<ApiResponse<StripeCheckoutPayload>>(`/api/bookings/${bookingId}/stripe-checkout`, {
        body: JSON.stringify({ appUrl: getApiBaseUrl(), returnTo }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
    });
    return payload.data;
}

export async function confirmStripeCheckout(
    bookingId: string,
    sessionId: string,
): Promise<{ bookingId: number }> {
    const payload = await fetchApi<ApiResponse<{ bookingId: number }>>(`/api/bookings/${bookingId}/stripe-confirm`, {
        body: JSON.stringify({ sessionId }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
    });

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

export async function getListingDetails(hotelId: string): Promise<ListingDetails> {
    const payload = await fetchApi<ApiResponse<ListingDetails>>(`/api/hotels/${hotelId}`);
    return payload.data;
}

export async function getCurrentProfile(): Promise<ProfileDataWithAvatarUrl> {
    const payload = await fetchApi<ApiResponse<ProfileDataWithAvatarUrl>>('/api/users/me');
    return payload.data;
}

export async function updateCurrentProfile(profile: ProfileData): Promise<ProfileDataWithAvatarUrl> {
    const payload = await fetchApi<ApiResponse<ProfileDataWithAvatarUrl>>('/api/users/me', {
        body: JSON.stringify(profile),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
    });
    return payload.data;
}

export async function uploadProfileAvatar(formData: FormData): Promise<ProfileDataWithAvatarUrl> {
    const payload = await fetchApi<ApiResponse<ProfileDataWithAvatarUrl>>('/api/users/me/avatar', {
        body: formData,
        method: 'POST',
    });
    return payload.data;
}

export async function removeProfileAvatar(): Promise<ProfileDataWithAvatarUrl> {
    const payload = await fetchApi<ApiResponse<ProfileDataWithAvatarUrl>>('/api/users/me/avatar', {
        method: 'DELETE',
    });
    return payload.data;
}

function hasData<T>(payload: T | ApiResponse<T>): payload is ApiResponse<T> {
    return typeof payload === 'object' && payload !== null && 'data' in payload;
}
