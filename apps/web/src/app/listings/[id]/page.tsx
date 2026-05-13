import { notFound } from "next/navigation";
import { getListingById, getRoomAvailabilityForHotel } from "@/server/services/hotelPanel";
import { ListingDetailsCard } from "@/components/ListingDetailsCard";
import type { ListingDetails } from "@/types/hotel-panel";
import type { RoomAvailability } from "@/types/room-availability";

interface Props {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: { checkInDate?: string; checkOutDate?: string; guests?: string } | Promise<{ checkInDate?: string; checkOutDate?: string; guests?: string }>;
}

export default async function ListingPage({ params, searchParams }: Props) {
  // In some Next.js runtimes `params` and `searchParams` can be Promises — unwrap them before use
  const resolvedParams = (await params) as { id: string };
  const resolvedSearchParams = (await searchParams) ?? {};
  const checkInDate = resolvedSearchParams.checkInDate ?? "";
  const checkOutDate = resolvedSearchParams.checkOutDate ?? "";
  const guestsParam = resolvedSearchParams.guests ?? "";
  const guestsCount = Math.max(1, Number.parseInt(guestsParam, 10) || 0);

  const listing: ListingDetails | null = await getListingById(resolvedParams.id);

  if (!listing) return notFound();

  const availability: RoomAvailability[] = checkInDate && checkOutDate
    ? await getRoomAvailabilityForHotel(
        Number(resolvedParams.id),
        checkInDate,
        checkOutDate,
        guestsCount
      )
    : [];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <ListingDetailsCard
        listing={listing}
        availability={availability}
        guestsCount={guestsCount}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
      />
    </main>
  );
}
