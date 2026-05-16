import Link from "next/link";
import {
  BanknotesIcon,
  CalendarDaysIcon,
  PhotoIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import type { PartnerRoomFormProps } from "@/types/partner";
import PartnerFormSection from "./PartnerFormSection";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/60";

const labelClass = "text-sm font-medium text-slate-300";

export default function PartnerRoomForm({ roomId }: PartnerRoomFormProps) {
  return (
    <form className="space-y-5">
      <PartnerFormSection
        title="Room info"
        description="Guest-facing room name, type, and operational status."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 md:col-span-2">
            <span className={labelClass}>Room name</span>
            <input className={inputClass} placeholder="Executive King Suite" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Status</span>
            <select className={inputClass} defaultValue="available">
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
        </div>
        <label className="grid gap-2">
          <span className={labelClass}>Description</span>
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            placeholder="A quiet executive room with workspace, city views, and lounge access."
          />
        </label>
      </PartnerFormSection>

      <PartnerFormSection title="Pricing" description="Static rate controls for preview.">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className={labelClass}>Base nightly rate</span>
            <input className={inputClass} placeholder="$248" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Weekend rate</span>
            <input className={inputClass} placeholder="$288" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Tax profile</span>
            <select className={inputClass} defaultValue="standard">
              <option value="standard">Standard lodging tax</option>
              <option value="exempt">Tax exempt</option>
            </select>
          </label>
        </div>
      </PartnerFormSection>

      <PartnerFormSection title="Images" description="Room photo placeholders.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.04] text-slate-400"
            >
              <PhotoIcon className="h-7 w-7" aria-hidden="true" />
            </div>
          ))}
        </div>
      </PartnerFormSection>

      <PartnerFormSection
        title="Availability"
        description="Inventory and blackout preview settings."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className={labelClass}>Rooms in inventory</span>
            <input className={inputClass} placeholder="14" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Minimum stay</span>
            <input className={inputClass} placeholder="1 night" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Blackout dates</span>
            <input className={inputClass} placeholder="None selected" />
          </label>
        </div>
      </PartnerFormSection>

      <PartnerFormSection title="Capacity" description="Guest limits and bed setup.">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className={labelClass}>Guests</span>
            <input className={inputClass} placeholder="2 adults" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Room size</span>
            <input className={inputClass} placeholder="48 sqm" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Beds</span>
            <input className={inputClass} placeholder="1 king bed" />
          </label>
        </div>
      </PartnerFormSection>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/partner/hotels/grand-orchid/rooms"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
        >
          Cancel
        </Link>
        <Link
          href="/partner/hotels/grand-orchid/rooms"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          Preview room
        </Link>
      </div>

      <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
        <span className="inline-flex items-center gap-2">
          <BanknotesIcon className="h-4 w-4" aria-hidden="true" />
          Rate preview only
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
          Availability not saved
        </span>
        <span className="inline-flex items-center gap-2">
          <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
          Capacity not validated
        </span>
      </div>
      <input type="hidden" value={roomId} readOnly />
    </form>
  );
}
