import {
  BanknotesIcon,
  BellIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import PartnerSection from "@/components/partner/PartnerSection";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300/60";

export default function Page() {
  return (
    <>
      <PartnerPageHeader
        eyebrow="Workspace controls"
        title="Settings"
        description="Static settings scaffold for company profile, payouts, security, and notifications."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PartnerSection title="Company info">
          <PartnerCard className="space-y-4">
            <div className="flex items-center gap-3 text-amber-200">
              <BuildingOffice2Icon className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-semibold text-white">Grand Orchid Group</h2>
            </div>
            <input className={inputClass} placeholder="Company legal name" />
            <input className={inputClass} placeholder="Business registration number" />
            <input className={inputClass} placeholder="Primary contact email" />
          </PartnerCard>
        </PartnerSection>

        <PartnerSection title="Payout settings">
          <PartnerCard className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-200">
              <BanknotesIcon className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-semibold text-white">Payout account</h2>
            </div>
            <input className={inputClass} placeholder="Bank account ending in 0421" />
            <select className={inputClass} defaultValue="weekly">
              <option value="weekly">Weekly payouts</option>
              <option value="monthly">Monthly payouts</option>
            </select>
          </PartnerCard>
        </PartnerSection>

        <PartnerSection title="Password/security">
          <PartnerCard className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-200">
              <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-semibold text-white">Security controls</h2>
            </div>
            <input className={inputClass} placeholder="Current password" />
            <input className={inputClass} placeholder="New password" />
            <button
              type="button"
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
            >
              Preview password update
            </button>
          </PartnerCard>
        </PartnerSection>

        <PartnerSection title="Notifications">
          <PartnerCard className="space-y-4">
            <div className="flex items-center gap-3 text-amber-200">
              <BellIcon className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-semibold text-white">Notification preferences</h2>
            </div>
            {["New bookings", "Cancellations", "Guest reviews", "Payout summaries"].map(
              (item) => (
                <label
                  key={item}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200"
                >
                  {item}
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-amber-300" />
                </label>
              )
            )}
          </PartnerCard>
        </PartnerSection>
      </div>
    </>
  );
}
