import Link from "next/link";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import {
  accountStatusTone,
  moderationStatusTone,
} from "@/lib/admin-display";
import {
  adminPartners,
  getAdminHotelsForPartner,
} from "@/lib/admin-mock-data";
import type { AdminPartner, AdminTableColumn } from "@/types/admin";

function countPartnerFlags(partnerId: string) {
  return getAdminHotelsForPartner(partnerId).reduce((total, hotel) => total + hotel.flags, 0);
}

function countPartnerBookings(partnerId: string) {
  return getAdminHotelsForPartner(partnerId).reduce((total, hotel) => total + hotel.bookings, 0);
}

const partnerColumns: AdminTableColumn<AdminPartner>[] = [
  {
    header: "Partner",
    render: (partner) => (
      <div>
        <Link href={`/admin/partners/${partner.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
          {partner.companyName}
        </Link>
        <p className="mt-1 text-slate-500">{partner.email}</p>
      </div>
    ),
  },
  { header: "Contact", render: (partner) => partner.contactName },
  {
    header: "Account",
    render: (partner) => <AdminStatusBadge label={partner.status} tone={accountStatusTone(partner.status)} />,
  },
  {
    header: "Verification",
    render: (partner) => <AdminStatusBadge label={partner.verificationStatus} tone={moderationStatusTone(partner.verificationStatus)} />,
  },
  {
    header: "Hotels",
    render: (partner) => getAdminHotelsForPartner(partner.id).length,
  },
  {
    header: "Bookings",
    render: (partner) => countPartnerBookings(partner.id),
  },
  {
    header: "Flags",
    render: (partner) => {
      const flags = countPartnerFlags(partner.id);

      return (
        <span className={flags > 10 ? "font-semibold text-red-200" : "text-slate-400"}>
          {flags}
        </span>
      );
    },
  },
  { header: "Payout", render: (partner) => partner.payoutStatus },
  {
    header: "Actions",
    render: (partner) => (
      <AdminActionMenu
        actions={[
          { label: "Inspect", href: `/admin/partners/${partner.id}`, tone: "blue" },
          { label: "Suspend", href: `/admin/partners/${partner.id}?action=suspend`, tone: "red" },
          { label: "Activate", href: `/admin/partners/${partner.id}?action=activate`, tone: "neutral" },
        ]}
      />
    ),
  },
];

export default function Page() {
  return (
    <>
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Partner operations
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Partner management
        </h1>
        <p className="max-w-3xl text-xs leading-5 text-slate-500">
          Partner accounts are the ownership root for hotel moderation, payout
          controls, verification state, and portfolio-level risk.
        </p>
      </div>

      <AdminFilters
        filters={[
          { label: "All", href: "/admin/partners", active: true, count: adminPartners.length },
          { label: "Active", href: "/admin/partners?status=active", count: 1, tone: "blue" },
          { label: "Under review", href: "/admin/partners?status=under_review", count: 1, tone: "amber" },
          { label: "Payout held", href: "/admin/partners?payout=held", count: 1, tone: "red" },
          { label: "Hotel flags", href: "/admin/partners?flags=high", count: 2, tone: "amber" },
        ]}
      />

      <AdminSection title="Partners table" description="Portfolio ownership, verification, payout state, flags, and account actions.">
        <AdminTable rows={adminPartners} columns={partnerColumns} getRowKey={(partner) => partner.id} />
      </AdminSection>
    </>
  );
}
