"use client";

import {
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { appendImageFiles, buildImagePayload, toImageDrafts } from "@/lib/partner-image-form";
import type {
  PartnerImageDraft,
  PartnerRoomFormProps,
  PartnerRoomType,
} from "@/types/partner-hotel";
import PartnerFormSection from "./PartnerFormSection";
import PartnerImageManager from "./PartnerImageManager";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/60";

const labelClass = "text-sm font-medium text-slate-300";

type ApiRoomResponse = {
  data?: PartnerRoomType;
  error?: {
    message?: string;
  };
};

function buildFormData(input: {
  hotelId: number;
  name: string;
  capacity: string;
  pricePerNight: string;
  totalRooms: string;
  images: PartnerImageDraft[];
}): FormData {
  const formData = new FormData();
  formData.set("payload", JSON.stringify({
    hotelId: input.hotelId,
    name: input.name,
    capacity: Number(input.capacity),
    pricePerNight: Number(input.pricePerNight),
    totalRooms: Number(input.totalRooms),
    images: buildImagePayload(input.images),
  }));
  appendImageFiles(formData, input.images);
  return formData;
}

export default function PartnerRoomForm({
  mode,
  hotelId,
  room,
  onCancel,
  onSaved,
}: PartnerRoomFormProps) {
  const router = useRouter();
  const [name, setName] = useState(room?.name ?? "");
  const [capacity, setCapacity] = useState(room ? String(room.capacity) : "");
  const [pricePerNight, setPricePerNight] = useState(room ? String(room.pricePerNight) : "");
  const [totalRooms, setTotalRooms] = useState(room ? String(room.totalRooms) : "");
  const [images, setImages] = useState<PartnerImageDraft[]>(() => toImageDrafts(room?.images ?? []));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(room ? `/api/rooms/${room.id}` : "/api/rooms", {
        method: room ? "PATCH" : "POST",
        body: buildFormData({ hotelId, name, capacity, pricePerNight, totalRooms, images }),
      });
      const payload = await response.json().catch(() => null) as ApiRoomResponse | null;

      if (!response.ok || !payload?.data) {
        setErrorMessage(payload?.error?.message ?? "Failed to save room type.");
        return;
      }

      onSaved?.(payload.data);
      router.refresh();
    } catch {
      setErrorMessage("Failed to save room type.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      {errorMessage ? (
        <div className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100">
          {errorMessage}
        </div>
      ) : null}

      <PartnerFormSection
        title="Room info"
        description="Guest-facing room type, capacity, price, and inventory."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass}>Room type name</span>
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Executive King Suite"
              required
            />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Capacity</span>
            <input
              className={inputClass}
              type="number"
              min={1}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              placeholder="2"
              required
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass}>Price per night</span>
            <input
              className={inputClass}
              type="number"
              min={1}
              value={pricePerNight}
              onChange={(event) => setPricePerNight(event.target.value)}
              placeholder="248"
              required
            />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Total rooms</span>
            <input
              className={inputClass}
              type="number"
              min={1}
              value={totalRooms}
              onChange={(event) => setTotalRooms(event.target.value)}
              placeholder="14"
              required
            />
          </label>
        </div>
      </PartnerFormSection>

      <PartnerFormSection title="Images" description="Room-specific image gallery.">
        <PartnerImageManager
          label="Room"
          images={images}
          onChange={setImages}
          fileInputId={`partner-room-images-${room?.id ?? "new"}`}
        />
      </PartnerFormSection>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"
        >
          <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? "Saving..." : mode === "new" ? "Create room type" : "Save room type"}
        </button>
      </div>

      <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
        <span className="inline-flex items-center gap-2">
          <BanknotesIcon className="h-4 w-4" aria-hidden="true" />
          Price validated
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
          Inventory saved
        </span>
        <span className="inline-flex items-center gap-2">
          <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
          Capacity enforced
        </span>
      </div>
    </form>
  );
}
