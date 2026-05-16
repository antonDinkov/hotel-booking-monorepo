import Link from "next/link";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import {
  reportSubjectHref,
  severityTone,
} from "@/lib/admin-display";
import {
  adminAnalyticsMetrics,
  adminModerationActions,
  adminReports,
  adminStats,
  adminSystemChecks,
} from "@/lib/admin-mock-data";
import type {
  AdminModerationAction,
  AdminReport,
  AdminSystemCheck,
  AdminTableColumn,
} from "@/types/admin";

const reportColumns: AdminTableColumn<AdminReport>[] = [
  {
    header: "Issue",
    render: (report) => (
      <div>
        <Link href={reportSubjectHref(report)} className="font-semibold text-slate-100 hover:text-blue-200">
          {report.subjectLabel}
        </Link>
        <p className="mt-1 text-slate-500">{report.reason}</p>
      </div>
    ),
  },
  {
    header: "Severity",
    render: (report) => <AdminStatusBadge label={report.severity} tone={severityTone(report.severity)} />,
  },
  {
    header: "Queue",
    render: (report) => <span className="text-slate-400">{report.assignedTo}</span>,
  },
  {
    header: "Actions",
    render: (report) => (
      <AdminActionMenu
        actions={[
          { label: "Inspect", href: reportSubjectHref(report), tone: "blue" },
          { label: "Queue", href: `/admin/reports?case=${report.id}`, tone: "neutral" },
        ]}
      />
    ),
  },
];

const actionColumns: AdminTableColumn<AdminModerationAction>[] = [
  {
    header: "Action",
    render: (action) => (
      <div>
        <p className="font-semibold text-slate-100">{action.action}</p>
        <p className="mt-1 text-slate-500">{action.target}</p>
      </div>
    ),
  },
  { header: "Actor", render: (action) => action.actor },
  { header: "Time", render: (action) => action.time },
  { header: "Outcome", render: (action) => action.outcome },
];

const healthColumns: AdminTableColumn<AdminSystemCheck>[] = [
  {
    header: "Service",
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

export default function Page() {
  const revenue = adminAnalyticsMetrics.find((metric) => metric.title === "Revenue");

  return (
    <>
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Global platform overview
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-50">
              Admin dashboard
            </h1>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
              Static operations scaffold for moderation, risk, payments, and
              platform health.
            </p>
          </div>
          <AdminActionMenu
            actions={[
              { label: "Reports", href: "/admin/reports", tone: "red" },
              { label: "System", href: "/admin/system", tone: "amber" },
              { label: "Payments", href: "/admin/payments", tone: "neutral" },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {adminStats.map((stat) => (
          <AdminStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <AdminSection title="Suspicious activity" description="Critical and high-signal items requiring operational review.">
          <AdminTable rows={adminReports} columns={reportColumns} getRowKey={(report) => report.id} />
        </AdminSection>

        <AdminSection title="Revenue overview" description="Static 7-period processed revenue sample.">
          <AdminPanel className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold text-slate-50">{revenue?.value}</p>
                <p className="mt-1 text-xs text-slate-500">{revenue?.caption}</p>
              </div>
              <AdminStatusBadge label="finance" tone="blue" />
            </div>
            <div className="mt-6 flex h-32 items-end gap-2 border-b border-slate-800">
              {revenue?.bars.map((bar, index) => (
                <div
                  key={`${bar}-${index}`}
                  className="w-full bg-blue-500/45"
                  style={{ height: `${bar}%` }}
                />
              ))}
            </div>
            <Link href="/admin/analytics" className="mt-4 inline-block text-xs font-semibold text-blue-200 hover:text-blue-100">
              Open analytics
            </Link>
          </AdminPanel>
        </AdminSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSection title="Latest moderation actions" description="Most recent operator decisions across reports, users, and partner portfolios.">
          <AdminTable rows={adminModerationActions} columns={actionColumns} getRowKey={(action) => action.id} />
        </AdminSection>

        <AdminSection title="System health" description="Operational status indicators for the static admin shell.">
          <AdminTable rows={adminSystemChecks} columns={healthColumns} getRowKey={(check) => check.name} />
        </AdminSection>
      </div>
    </>
  );
}
