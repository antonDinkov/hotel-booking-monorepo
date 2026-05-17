import { notFound, redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import PartnerRoomsManager from "@/components/partner/PartnerRoomsManager";
import { getPartnerHotelDetails } from "@/server/services/partnerHotels";
import type { PartnerHotelPageProps } from "@/types/partner";

function parseHotelId(value: string): number {
  const hotelId = Number(value);
  if (!Number.isInteger(hotelId) || hotelId < 1) notFound();
  return hotelId;
}

export default async function Page({ params }: PartnerHotelPageProps) {
  const auth = await authorize(["partner"]);
  if (!auth.ok || !auth.userId) redirect("/partner/login");

  const { id } = await params;
  const hotel = await getPartnerHotelDetails(auth.userId, parseHotelId(id));
  if (!hotel) notFound();

  return (
    <>
      <PartnerPageHeader
        eyebrow="Room inventory"
        title={`${hotel.name} rooms`}
        description="Manage real room types, inventory, pricing, capacity, and room-specific image galleries."
      />
      <PartnerRoomsManager hotel={{ id: hotel.id, name: hotel.name }} initialRooms={hotel.rooms} />
    </>
  );
}
