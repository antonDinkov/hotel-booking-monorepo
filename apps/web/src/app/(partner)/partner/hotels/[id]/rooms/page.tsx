import {
  DocumentDuplicateIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerEmptyState from "@/components/partner/PartnerEmptyState";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import { partnerHotels, partnerRooms } from "@/lib/partner-mock-data";
import type { PartnerBadgeTone, PartnerHotelPageProps } from "@/types/partner";

function roomTone(status: string): PartnerBadgeTone {
  if (status === "Available") return "emerald";
  if (status === "Limited") return "amber";
  return "slate";
}

export default async function Page({ params }: PartnerHotelPageProps) {
  const { id } = await params;
  const hotel = partnerHotels.find((item) => item.id === id) ?? partnerHotels[0];
  const rooms = partnerRooms.filter((room) => room.hotelId === hotel.id);

  return (
    <>
      <PartnerPageHeader
        eyebrow="Room inventory"
        title={`${hotel.name} rooms`}
        description="Room cards for the selected hotel with visual-only edit, disable, and duplicate actions."
        actions={
          <Link
            href="/partner/rooms/orchid-executive/edit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Add room
          </Link>
        }
      />

      {rooms.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {rooms.map((room) => (
            <PartnerCard key={room.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{room.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {room.type} - {room.capacity} - {room.size}
                  </p>
                </div>
                <PartnerBadge tone={roomTone(room.status)}>{room.status}</PartnerBadge>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Rate</p>
                  <p className="mt-1 font-semibold text-white">{room.rate}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Occupancy</p>
                  <p className="mt-1 font-semibold text-white">{room.occupancy}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Photos</p>
                  <p className="mt-1 font-semibold text-white">{room.imageCount}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <Link
                  href={`/partner/rooms/${room.id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  <NoSymbolIcon className="h-4 w-4" aria-hidden="true" />
                  Disable
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" aria-hidden="true" />
                  Duplicate
                </button>
              </div>
            </PartnerCard>
          ))}
        </div>
      ) : (
        <PartnerEmptyState
          title="No rooms in this static preview"
          description="Use the add room action to preview the room editor scaffold."
          action={
            <Link
              href="/partner/rooms/orchid-executive/edit"
              className="rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950"
            >
              Add room
            </Link>
          }
        />
      )}
    </>
  );
}
