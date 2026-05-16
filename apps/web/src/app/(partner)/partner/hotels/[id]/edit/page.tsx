import PartnerHotelForm from "@/components/partner/PartnerHotelForm";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import { partnerHotels } from "@/lib/partner-mock-data";
import type { PartnerHotelPageProps } from "@/types/partner";

export default async function Page({ params }: PartnerHotelPageProps) {
  const { id } = await params;
  const hotel = partnerHotels.find((item) => item.id === id) ?? partnerHotels[0];

  return (
    <>
      <PartnerPageHeader
        eyebrow="Listing editor"
        title={`Edit ${hotel.name}`}
        description="A static editing surface matching the add hotel sections without persisting changes."
      />
      <PartnerHotelForm mode="edit" hotelId={hotel.id} />
    </>
  );
}
