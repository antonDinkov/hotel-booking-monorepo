import Link from "next/link";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import { severityTone } from "@/lib/admin-display";
import { adminAuditLogs, adminSystemChecks } from "@/lib/admin-mock-data";
import type { AdminAuditLog, AdminSystemCheck, AdminTableColumn } from "@/types/admin";

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
  { header: "Updated", render: (check) => check.updatedAt },
];

const auditColumns: AdminTableColumn<AdminAuditLog>[] = [
  { header: "Time", render: (log) => log.timestamp },
  { header: "Actor", render: (log) => log.actor },
  { header: "Action", render: (log) => log.action },
  { header: "Target", render: (log) => log.target },
  {
    header: "Severity",
    render: (log) => <AdminStatusBadge label={log.severity} tone={severityTone(log.severity)} />,
  },
];

export default function Page() {
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
            Static environment, queue, email, storage, API, and audit log
            scaffold for future operational telemetry.
          </p>
        </div>
        <AdminActionMenu
          actions={[
            { label: "Settings", href: "/admin/settings", tone: "neutral" },
            { label: "Reports", href: "/admin/reports", tone: "red" },
          ]}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Environment", "production", "visual only scaffold"],
          ["Queues", "9m lag", "moderation queue delay"],
          ["Email", "degraded", "booking notification backlog"],
          ["Storage", "72%", "media bucket allocation"],
        ].map(([label, value, detail]) => (
          <AdminPanel key={label} className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-600">{label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-50">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </AdminPanel>
        ))}
      </div>

      <AdminSection title="API and system status">
        <AdminTable rows={adminSystemChecks} columns={checkColumns} getRowKey={(check) => check.name} />
      </AdminSection>

      <AdminSection
        title="Audit logs"
        actions={
          <Link href="/admin/settings" className="text-xs font-semibold text-blue-200 hover:text-blue-100">
            Audit configuration
          </Link>
        }
      >
        <AdminTable rows={adminAuditLogs} columns={auditColumns} getRowKey={(log) => log.id} />
      </AdminSection>
    </>
  );
}
