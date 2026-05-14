import { notFound } from "next/navigation";
import { getListingById } from "@/server/services/hotelPanel";
import PickDatesClient from "./PickDatesClient";
import type { ListingDetails } from "@/types/hotel-panel";
import { log } from "console";

interface Props {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: {
    roomTypeId?: string;
    roomPrice?: string;
    rooms?: string;
    guests?: string;
    roomCapacity?: string;
  } | Promise<{
    roomTypeId?: string;
    roomPrice?: string;
    rooms?: string;
    guests?: string;
    roomCapacity?: string;
  }>;
}

export default async function PickDatesPage({ params, searchParams }: Props) {
  const resolvedParams = (await params) as { id: string };
  const resolvedSearchParams = (await searchParams) ?? {};

  const listing: ListingDetails | null = await getListingById(resolvedParams.id);
  if (!listing) return notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PickDatesClient
        listing={listing}
        roomTypeId={resolvedSearchParams.roomTypeId ?? ""}
        roomPrice={Number.parseInt(resolvedSearchParams.roomPrice ?? "", 10) || listing.price || 0}
        rooms={Number.parseInt(resolvedSearchParams.rooms ?? "", 10) || 1}
        guests={resolvedSearchParams.guests ?? "1"}
        roomCapacity={Number.parseInt(resolvedSearchParams.roomCapacity ?? "", 10) || 1}
      />
    </main>
  );
}
