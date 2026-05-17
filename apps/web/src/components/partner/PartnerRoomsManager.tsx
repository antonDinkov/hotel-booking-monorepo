"use client";

import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState } from "react";

import type { PartnerRoomType, PartnerRoomsManagerProps } from "@/types/partner-hotel";
import PartnerBadge from "./PartnerBadge";
import PartnerCard from "./PartnerCard";
import PartnerEmptyState from "./PartnerEmptyState";
import PartnerRoomForm from "./PartnerRoomForm";

type ApiDeleteResponse = {
  error?: {
    message?: string;
  };
};

export default function PartnerRoomsManager({
  hotel,
  initialRooms,
}: PartnerRoomsManagerProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [editingRoom, setEditingRoom] = useState<PartnerRoomType | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const closeForm = () => {
    setEditingRoom(null);
    setIsAddingRoom(false);
    setErrorMessage(null);
  };

  const handleSaved = (room: PartnerRoomType) => {
    setRooms((current) => {
      const exists = current.some((item) => item.id === room.id);
      return exists
        ? current.map((item) => (item.id === room.id ? room : item))
        : [...current, room];
    });
    closeForm();
  };

  const handleDelete = async (room: PartnerRoomType) => {
    if (!window.confirm(`Delete ${room.name}?`)) return;

    setErrorMessage(null);
    const response = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => null) as ApiDeleteResponse | null;

    if (!response.ok) {
      setErrorMessage(payload?.error?.message ?? "Failed to delete room type.");
      return;
    }

    setRooms((current) => current.filter((item) => item.id !== room.id));
  };

  return (
    <div className="grid gap-5">
      {errorMessage ? (
        <div className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100">
          {errorMessage}
        </div>
      ) : null}

      {isAddingRoom || editingRoom ? (
        <PartnerCard>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">
              {editingRoom ? `Edit ${editingRoom.name}` : `Add room type to ${hotel.name}`}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Room changes are scoped to this hotel and partner account.
            </p>
          </div>
          <PartnerRoomForm
            mode={editingRoom ? "edit" : "new"}
            hotelId={hotel.id}
            room={editingRoom ?? undefined}
            onCancel={closeForm}
            onSaved={handleSaved}
          />
        </PartnerCard>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setEditingRoom(null);
            setIsAddingRoom(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add room
        </button>
      </div>

      {rooms.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {rooms.map((room) => (
            <PartnerCard key={room.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{room.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Capacity {room.capacity} - ${room.pricePerNight}/night
                  </p>
                </div>
                <PartnerBadge tone="emerald">Active</PartnerBadge>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total rooms</p>
                  <p className="mt-1 font-semibold text-white">{room.totalRooms}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Created units</p>
                  <p className="mt-1 font-semibold text-white">{room.existingRoomsCount}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Photos</p>
                  <p className="mt-1 font-semibold text-white">{room.images.length}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {room.images.slice(0, 3).map((image) => (
                  <div key={image.id} className="aspect-[4/3] overflow-hidden rounded-lg bg-white/[0.04]">
                    <Image
                      src={image.imageUrl}
                      alt={`${room.name} image`}
                      width={240}
                      height={180}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingRoom(false);
                    setEditingRoom(room);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(room)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300/20 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/10"
                >
                  <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </PartnerCard>
          ))}
        </div>
      ) : (
        <PartnerEmptyState
          title="No room types yet"
          description="Create the first room type for this hotel and attach room-specific images."
          action={
            <button
              type="button"
              onClick={() => setIsAddingRoom(true)}
              className="rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950"
            >
              Add room
            </button>
          }
        />
      )}
    </div>
  );
}
