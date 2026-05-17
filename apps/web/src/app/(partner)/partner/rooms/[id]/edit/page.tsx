import { notFound, redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import PartnerRoomForm from "@/components/partner/PartnerRoomForm";
import { getPartnerRoom } from "@/server/services/partnerRooms";
import type { PartnerRoomPageProps } from "@/types/partner";

function parseRoomId(value: string): number {
  const roomId = Number(value);
  if (!Number.isInteger(roomId) || roomId < 1) notFound();
  return roomId;
}

export default async function Page({ params }: PartnerRoomPageProps) {
  const auth = await authorize(["partner"]);
  if (!auth.ok || !auth.userId) redirect("/partner/login");

  const { id } = await params;
  const room = await getPartnerRoom(auth.userId, parseRoomId(id));
  if (!room) notFound();

  return (
    <>
      <PartnerPageHeader
        eyebrow="Room editor"
        title={`Edit ${room.name}`}
        description="Edit room type pricing, capacity, inventory, and room-specific image gallery."
      />
      <PartnerRoomForm mode="edit" hotelId={room.hotelId} room={room} />
    </>
  );
}
