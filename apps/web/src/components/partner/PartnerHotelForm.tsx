import Link from "next/link";
import {
  BanknotesIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  MapPinIcon,
  PhotoIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import type { PartnerHotelFormProps } from "@/types/partner";
import PartnerFormSection from "./PartnerFormSection";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/60";

const labelClass = "text-sm font-medium text-slate-300";

export default function PartnerHotelForm({
  mode,
  hotelId,
}: PartnerHotelFormProps) {
  const cancelHref = hotelId ? `/partner/hotels/${hotelId}` : "/partner/hotels";

  return (
    <form className="space-y-5">
      <PartnerFormSection
        title="Basic information"
        description="Core listing details shown to guests and internal operators."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass}>Hotel name</span>
            <input className={inputClass} placeholder="Grand Orchid Residences" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Brand or company</span>
            <input className={inputClass} placeholder="Grand Orchid Group" />
          </label>
        </div>
        <label className="grid gap-2">
          <span className={labelClass}>Short description</span>
          <textarea
            className={`${inputClass} min-h-28 resize-y`}
            placeholder="A refined city hotel for business travelers and long-stay guests."
          />
        </label>
      </PartnerFormSection>

      <PartnerFormSection
        title="Location"
        description="Address and arrival context for guests."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 md:col-span-2">
            <span className={labelClass}>Street address</span>
            <input className={inputClass} placeholder="12 Wireless Road" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>City</span>
            <input className={inputClass} placeholder="Bangkok" />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className={labelClass}>Country</span>
            <input className={inputClass} placeholder="Thailand" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Postal code</span>
            <input className={inputClass} placeholder="10330" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Area</span>
            <input className={inputClass} placeholder="Lumphini" />
          </label>
        </div>
      </PartnerFormSection>

      <PartnerFormSection
        title="Amenities"
        description="Preview chips for the facilities guests can filter by."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["Sky pool", "Business lounge", "Airport transfer", "Spa", "Meeting rooms", "EV parking"].map(
            (amenity) => (
              <label
                key={amenity}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200"
              >
                <input type="checkbox" className="h-4 w-4 accent-amber-300" />
                {amenity}
              </label>
            )
          )}
        </div>
      </PartnerFormSection>

      <PartnerFormSection title="Images" description="Visual placeholders for hotel media.">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.04] text-slate-400"
            >
              <PhotoIcon className="h-8 w-8" aria-hidden="true" />
            </div>
          ))}
        </div>
      </PartnerFormSection>

      <PartnerFormSection
        title="Policies"
        description="Check-in, cancellation, and guest operation settings."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className={labelClass}>Check-in</span>
            <input className={inputClass} placeholder="14:00" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Check-out</span>
            <input className={inputClass} placeholder="11:00" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Cancellation</span>
            <select className={inputClass} defaultValue="flexible">
              <option value="flexible">Flexible</option>
              <option value="moderate">Moderate</option>
              <option value="strict">Strict</option>
            </select>
          </label>
        </div>
      </PartnerFormSection>

      <PartnerFormSection
        title="Payments"
        description="Static payout and billing preview fields."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass}>Payout cadence</span>
            <select className={inputClass} defaultValue="weekly">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Invoice contact</span>
            <input className={inputClass} placeholder="finance@example.com" />
          </label>
        </div>
      </PartnerFormSection>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
        >
          Cancel
        </Link>
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          {mode === "new" ? (
            <BuildingOffice2Icon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
          )}
          {mode === "new" ? "Preview hotel" : "Preview changes"}
        </Link>
      </div>

      <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
        <span className="inline-flex items-center gap-2">
          <MapPinIcon className="h-4 w-4" aria-hidden="true" />
          Location preview only
        </span>
        <span className="inline-flex items-center gap-2">
          <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
          Policies not saved
        </span>
        <span className="inline-flex items-center gap-2">
          <BanknotesIcon className="h-4 w-4" aria-hidden="true" />
          No payment setup
        </span>
      </div>
    </form>
  );
}
