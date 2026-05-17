"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BanknotesIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

import { appendImageFiles, buildImagePayload, toImageDrafts } from "@/lib/partner-image-form";
import type {
  PartnerHotelDetails,
  PartnerHotelFormProps,
  PartnerImageDraft,
  PartnerPaymentMethod,
} from "@/types/partner-hotel";
import PartnerImageManager from "./PartnerImageManager";
import PartnerFormSection from "./PartnerFormSection";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/60";

const labelClass = "text-sm font-medium text-slate-300";

const paymentOptions: Array<{ value: PartnerPaymentMethod; label: string }> = [
  { value: "stripe", label: "Card via Stripe Checkout" },
  { value: "cash_on_arrival", label: "Cash on arrival" },
];

type ApiHotelResponse = {
  data?: PartnerHotelDetails;
  error?: {
    message?: string;
  };
};

function getInitialPaymentMethods(hotel?: PartnerHotelDetails): PartnerPaymentMethod[] {
  return hotel?.paymentMethods.length ? hotel.paymentMethods : ["stripe", "cash_on_arrival"];
}

function buildFormData(input: {
  name: string;
  location: string;
  description: string;
  paymentMethods: PartnerPaymentMethod[];
  images: PartnerImageDraft[];
}): FormData {
  const formData = new FormData();
  formData.set("payload", JSON.stringify({
    name: input.name,
    location: input.location,
    description: input.description,
    paymentMethods: input.paymentMethods,
    images: buildImagePayload(input.images),
  }));
  appendImageFiles(formData, input.images);
  return formData;
}

export default function PartnerHotelForm({ mode, hotel }: PartnerHotelFormProps) {
  const router = useRouter();
  const [name, setName] = useState(hotel?.name ?? "");
  const [location, setLocation] = useState(hotel?.location ?? "");
  const [description, setDescription] = useState(hotel?.description ?? "");
  const [paymentMethods, setPaymentMethods] = useState<PartnerPaymentMethod[]>(
    getInitialPaymentMethods(hotel)
  );
  const [images, setImages] = useState<PartnerImageDraft[]>(() => toImageDrafts(hotel?.images ?? []));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cancelHref = hotel ? `/partner/hotels/${hotel.id}` : "/partner/hotels";

  const togglePaymentMethod = (method: PartnerPaymentMethod) => {
    setPaymentMethods((current) => (
      current.includes(method)
        ? current.filter((item) => item !== method)
        : [...current, method]
    ));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(hotel ? `/api/hotels/${hotel.id}` : "/api/hotels", {
        method: hotel ? "PATCH" : "POST",
        body: buildFormData({ name, location, description, paymentMethods, images }),
      });
      const payload = await response.json().catch(() => null) as ApiHotelResponse | null;

      if (!response.ok || !payload?.data) {
        setErrorMessage(payload?.error?.message ?? "Failed to save hotel.");
        return;
      }

      router.push(`/partner/hotels/${payload.data.id}`);
      router.refresh();
    } catch {
      setErrorMessage("Failed to save hotel.");
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
        title="Basic information"
        description="Core listing details shown to guests and internal operators."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass}>Hotel name</span>
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Grand Orchid Residences"
              required
            />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Location</span>
            <input
              className={inputClass}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Bangkok, Thailand"
              required
            />
          </label>
        </div>
        <label className="grid gap-2">
          <span className={labelClass}>Description</span>
          <textarea
            className={`${inputClass} min-h-28 resize-y`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="A refined city hotel for business travelers and long-stay guests."
          />
        </label>
      </PartnerFormSection>

      <PartnerFormSection title="Images" description="General hotel image gallery.">
        <PartnerImageManager
          label="Hotel"
          images={images}
          onChange={setImages}
          fileInputId="partner-hotel-images"
        />
      </PartnerFormSection>

      <PartnerFormSection
        title="Payments"
        description="Payment methods available when guests book this hotel."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {paymentOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-amber-300"
                checked={paymentMethods.includes(option.value)}
                onChange={() => togglePaymentMethod(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </PartnerFormSection>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"
        >
          {mode === "new" ? (
            <BuildingOffice2Icon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
          )}
          {isSubmitting ? "Saving..." : mode === "new" ? "Create hotel" : "Save changes"}
        </button>
      </div>

      <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
        <span className="inline-flex items-center gap-2">
          <MapPinIcon className="h-4 w-4" aria-hidden="true" />
          Partner-scoped listing
        </span>
        <span className="inline-flex items-center gap-2">
          <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
          Ownership checked on save
        </span>
        <span className="inline-flex items-center gap-2">
          <BanknotesIcon className="h-4 w-4" aria-hidden="true" />
          Payment methods saved
        </span>
      </div>
    </form>
  );
}
