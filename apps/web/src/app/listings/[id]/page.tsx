import { notFound } from "next/navigation";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { getFavoriteHotelIds } from "@/server/services/favorites";
import { getListingById, getRoomAvailabilityForHotel } from "@/server/services/hotelPanel";
import { ListingDetailsCard } from "@/components/ListingDetailsCard";
import type { ListingDetails } from "@/types/hotel-panel";
import type { RoomAvailability } from "@/types/room-availability";

interface Props {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: { checkInDate?: string; checkOutDate?: string; guests?: string } | Promise<{ checkInDate?: string; checkOutDate?: string; guests?: string }>;
}

function getDefaultStayDates() {
  const checkIn = new Date();
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 1);
  return {
    checkInDate: checkIn.toISOString().slice(0, 10),
    checkOutDate: checkOut.toISOString().slice(0, 10),
  };
}

export default async function ListingPage({ params, searchParams }: Props) {
  // In some Next.js runtimes `params` and `searchParams` can be Promises — unwrap them before use
  const resolvedParams = (await params) as { id: string };
  const resolvedSearchParams = (await searchParams) ?? {};
  const hasSearchDates = Boolean(resolvedSearchParams.checkInDate && resolvedSearchParams.checkOutDate);
  const defaultStayDates = getDefaultStayDates();
  const checkInDate = resolvedSearchParams.checkInDate ?? defaultStayDates.checkInDate;
  const checkOutDate = resolvedSearchParams.checkOutDate ?? defaultStayDates.checkOutDate;
  const guestsParam = resolvedSearchParams.guests ?? "";
  const guestsCount = Math.max(1, Number.parseInt(guestsParam, 10) || 0);

  const listing: ListingDetails | null = await getListingById(resolvedParams.id);

  if (!listing) return notFound();

  const auth = await authorize(["client"]);
  const canFavorite = Boolean(auth.ok && auth.userId);
  const [availability, favoriteHotelIds]: [RoomAvailability[], number[]] = await Promise.all([
    checkInDate && checkOutDate
      ? getRoomAvailabilityForHotel(Number(resolvedParams.id), checkInDate, checkOutDate, guestsCount)
      : Promise.resolve([]),
    canFavorite ? getFavoriteHotelIds(auth.userId as string) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <ListingDetailsCard
        listing={listing}
        availability={availability}
        guestsCount={guestsCount}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        hasSearchDates={hasSearchDates}
        initialIsFavorite={favoriteHotelIds.includes(Number(listing.id))}
        canFavorite={canFavorite}
      />
    </main>
  );
}
