import { notFound, redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import PartnerHotelForm from "@/components/partner/PartnerHotelForm";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
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
        eyebrow="Listing editor"
        title={`Edit ${hotel.name}`}
        description="Edit hotel details, general images, cover image, ordering, and payment methods."
      />
      <PartnerHotelForm mode="edit" hotel={hotel} />
    </>
  );
}
