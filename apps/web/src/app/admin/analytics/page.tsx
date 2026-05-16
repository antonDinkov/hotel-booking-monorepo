import Link from "next/link";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import {
  accountStatusTone,
  moderationStatusTone,
} from "@/lib/admin-display";
import {
  adminAnalyticsMetrics,
  adminBookings,
  adminPartners,
  getAdminHotelsForPartner,
} from "@/lib/admin-mock-data";
import type { AdminPartner, AdminTableColumn } from "@/types/admin";

function countPartnerBookings(partnerId: string) {
  return getAdminHotelsForPartner(partnerId).reduce((total, hotel) => total + hotel.bookings, 0);
}

const partnerColumns: AdminTableColumn<AdminPartner>[] = [
  {
    header: "Partner",
    render: (partner) => (
      <Link href={`/admin/partners/${partner.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
        {partner.companyName}
      </Link>
    ),
  },
  {
    header: "Hotels",
    render: (partner) => getAdminHotelsForPartner(partner.id).length,
  },
  { header: "Bookings", render: (partner) => countPartnerBookings(partner.id) },
  {
    header: "Account",
    render: (partner) => <AdminStatusBadge label={partner.status} tone={accountStatusTone(partner.status)} />,
  },
  {
    header: "Verification",
    render: (partner) => <AdminStatusBadge label={partner.verificationStatus} tone={moderationStatusTone(partner.verificationStatus)} />,
  },
];

export default function Page() {
  const topPartners = [...adminPartners]
    .sort((a, b) => countPartnerBookings(b.id) - countPartnerBookings(a.id))
    .slice(0, 4);

  return (
    <>
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Platform intelligence
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Analytics
        </h1>
        <p className="max-w-3xl text-xs leading-5 text-slate-500">
          Static chart scaffold for growth, bookings, revenue, active users,
          cancellation trends, and top-performing partner portfolios.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminAnalyticsMetrics.map((metric) => (
          <AdminPanel key={metric.title} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  {metric.title}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">{metric.value}</p>
                <p className="mt-1 text-xs text-slate-500">{metric.caption}</p>
              </div>
              <AdminStatusBadge label="trend" tone={metric.tone} />
            </div>
            <div className="mt-5 flex h-28 items-end gap-1.5 border-b border-slate-800">
              {metric.bars.map((bar, index) => (
                <div
                  key={`${metric.title}-${index}`}
                  className="w-full bg-slate-700"
                  style={{ height: `${bar}%` }}
                />
              ))}
            </div>
          </AdminPanel>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <AdminSection title="Active users and booking mix">
          <AdminPanel className="grid gap-4 p-4 md:grid-cols-3">
            {[
              ["Active users", "12,904", "7-day unique accounts"],
              ["Completed bookings", String(adminBookings.filter((booking) => booking.status === "confirmed").length), "mock confirmed sample"],
              ["Cancellation trends", "7.8%", "above 30-day baseline"],
            ].map(([label, value, detail]) => (
              <div key={label} className="border border-slate-800 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-600">{label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-50">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{detail}</p>
              </div>
            ))}
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Cancellation trend">
          <AdminPanel className="p-4">
            <div className="flex h-40 items-end gap-2 border-b border-slate-800">
              {[18, 22, 31, 28, 42, 52, 49, 57, 61, 54].map((bar, index) => (
                <div
                  key={`${bar}-${index}`}
                  className="w-full bg-amber-500/55"
                  style={{ height: `${bar}%` }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Static cancellation trend placeholder for later analytics service data.
            </p>
          </AdminPanel>
        </AdminSection>
      </div>

      <AdminSection title="Top-performing partners">
        <AdminTable rows={topPartners} columns={partnerColumns} getRowKey={(partner) => partner.id} />
      </AdminSection>
    </>
  );
}
