import Link from "next/link";
import { redirect } from "next/navigation";

import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { getAdminSystemStatus } from "@/server/services/adminSystem";
import type { AdminBadgeTone, AdminTableColumn } from "@/types/admin";
import type {
  AdminSystemCheck,
  AdminSystemConfigurationItem,
} from "@/types/admin-system";

const checkColumns: AdminTableColumn<AdminSystemCheck>[] = [
  {
    header: "System",
    render: (check) => (
      <div>
        <p className="font-semibold text-slate-100">{check.name}</p>
        <p className="mt-1 text-slate-500">{check.detail}</p>
      </div>
    ),
  },
  {
    header: "Status",
    render: (check) => <AdminStatusBadge label={check.status} tone={check.tone} />,
  },
  { header: "Updated", render: (check) => check.updatedAt.slice(0, 19).replace("T", " ") },
];

const configColumns: AdminTableColumn<AdminSystemConfigurationItem>[] = [
  {
    header: "Configuration",
    render: (item) => (
      <div>
        <p className="font-semibold text-slate-100">{item.label}</p>
        <p className="mt-1 font-mono text-[10px] text-slate-600">{item.key}</p>
      </div>
    ),
  },
  {
    header: "Status",
    render: (item) => <AdminStatusBadge label={item.configured ? "configured" : "missing"} tone={item.tone} />,
  },
  { header: "Detail", render: (item) => item.detail },
];

function healthLabel(tone: AdminBadgeTone): string {
  if (tone === "blue") return "ok";
  if (tone === "amber") return "review";
  if (tone === "red") return "issue";
  return "info";
}

async function requireAdmin() {
  const auth = await authorize(["admin"]);
  if (!auth.ok) redirect("/admin/login");
}

export default async function Page() {
  await requireAdmin();
  const result = await getAdminSystemStatus();

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Platform health
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
            System
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
            Safe operational status for database connectivity, Stripe, R2
            storage, runtime configuration, and booking payment health.
          </p>
        </div>
        <AdminActionMenu
          actions={[
            { label: "Refresh", href: "/admin/system", tone: "blue" },
            { label: "Settings", href: "/admin/settings", tone: "neutral" },
          ]}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {result.cards.map((card) => (
          <AdminPanel key={card.label} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-600">{card.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-50">{card.value}</p>
                <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
              </div>
              <AdminStatusBadge label={healthLabel(card.tone)} tone={card.tone} />
            </div>
          </AdminPanel>
        ))}
      </div>

      <AdminSection title="API and system status">
        <AdminTable rows={result.checks} columns={checkColumns} getRowKey={(check) => check.name} />
      </AdminSection>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <AdminSection title="Safe configuration checklist">
          <AdminTable rows={result.configuration} columns={configColumns} getRowKey={(item) => item.key} />
        </AdminSection>

        <AdminSection
          title="Payment webhook health"
          actions={
            <Link href="/admin/payments" className="text-xs font-semibold text-blue-200 hover:text-blue-100">
              Payments
            </Link>
          }
        >
          <AdminPanel className="space-y-3 p-4">
            {[
              ["Stripe bookings", result.paymentHealth.stripeBookings],
              ["Paid Stripe bookings", result.paymentHealth.paidStripeBookings],
              ["Missing payment intent", result.paymentHealth.stripeBookingsMissingPaymentIntent],
              ["Refund pending", result.paymentHealth.refundPending],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-semibold text-slate-100">{value}</p>
              </div>
            ))}
            <p className="text-xs leading-5 text-slate-500">
              Latest Stripe booking: {result.paymentHealth.latestStripeBookingAt?.slice(0, 19).replace("T", " ") ?? "Not available"}
            </p>
          </AdminPanel>
        </AdminSection>
      </div>

      <AdminSection title="Runtime summary">
        <AdminPanel className="grid gap-4 p-4 md:grid-cols-4">
          {[
            ["Environment", result.runtime.environment],
            ["Node.js", result.runtime.nodeVersion],
            ["Next.js", result.runtime.nextVersion],
            ["Generated", result.runtime.generatedAt.slice(0, 19).replace("T", " ")],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] uppercase tracking-wide text-slate-600">{label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
            </div>
          ))}
        </AdminPanel>
      </AdminSection>
    </>
  );
}
