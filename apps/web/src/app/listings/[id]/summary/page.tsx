import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { getListingById } from "@/server/services/hotelPanel";
import BookingSummaryClient from "./BookingSummaryClient";
import type { ListingDetails } from "@/types/hotel-panel";

interface Props {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: {
    checkInDate?: string;
    checkOutDate?: string;
    guests?: string;
    roomTypeId?: string;
    rooms?: string;
    roomPrice?: string;
  } | Promise<{
    checkInDate?: string;
    checkOutDate?: string;
    guests?: string;
    roomTypeId?: string;
    rooms?: string;
    roomPrice?: string;
  }>;
}

export default async function SummaryPage({ params, searchParams }: Props) {
  const resolvedParams = (await params) as { id: string };
  const resolvedSearchParams = (await searchParams) ?? {};

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const listing: ListingDetails | null = await getListingById(resolvedParams.id);
  if (!listing) return notFound();

  const checkInDate = resolvedSearchParams.checkInDate ?? "";
  const checkOutDate = resolvedSearchParams.checkOutDate ?? "";
  const guests = resolvedSearchParams.guests ?? "1";
  const roomTypeId = resolvedSearchParams.roomTypeId ?? "";
  const rooms = resolvedSearchParams.rooms ?? "1";
  const roomPrice = Number.parseInt(resolvedSearchParams.roomPrice ?? "", 10) || listing.price || 0;

  if (!checkInDate || !checkOutDate || !roomTypeId) {
    return notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <BookingSummaryClient
        listing={listing}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        guests={guests}
        roomTypeId={roomTypeId}
        rooms={rooms}
        roomPrice={roomPrice}
      />
    </main>
  );
}
