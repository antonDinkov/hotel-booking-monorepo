import Link from "next/link";
import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import { partnerNotifications } from "@/lib/partner-mock-data";

export default function Page() {
  return (
    <>
      <PartnerPageHeader
        eyebrow="Activity feed"
        title="Notifications"
        description="Static notification list for new bookings, cancellations, new reviews, and payouts."
      />

      <div className="grid gap-4">
        {partnerNotifications.map((notification) => (
          <Link key={notification.id} href={notification.href}>
            <PartnerCard className="transition hover:border-amber-300/30 hover:bg-white/[0.08]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <PartnerBadge tone={notification.tone}>
                      {notification.type}
                    </PartnerBadge>
                    <span className="text-xs text-slate-500">{notification.time}</span>
                  </div>
                  <h2 className="mt-3 font-semibold text-white">{notification.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{notification.detail}</p>
                </div>
                <span className="text-sm font-semibold text-amber-200">Open</span>
              </div>
            </PartnerCard>
          </Link>
        ))}
      </div>
    </>
  );
}
