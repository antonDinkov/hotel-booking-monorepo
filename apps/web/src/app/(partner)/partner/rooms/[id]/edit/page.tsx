import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import PartnerRoomForm from "@/components/partner/PartnerRoomForm";
import { partnerRooms } from "@/lib/partner-mock-data";
import type { PartnerRoomPageProps } from "@/types/partner";

export default async function Page({ params }: PartnerRoomPageProps) {
  const { id } = await params;
  const room = partnerRooms.find((item) => item.id === id) ?? partnerRooms[0];

  return (
    <>
      <PartnerPageHeader
        eyebrow="Room editor"
        title={`Edit ${room.name}`}
        description="Visual-only editor for room info, pricing, images, availability, and capacity."
      />
      <PartnerRoomForm roomId={room.id} />
    </>
  );
}
