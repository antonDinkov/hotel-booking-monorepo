import Link from "next/link";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import {
  reportSubjectHref,
  severityTone,
} from "@/lib/admin-display";
import { adminAuditLogs, adminReports } from "@/lib/admin-mock-data";
import type { AdminAuditLog, AdminReport, AdminTableColumn } from "@/types/admin";

const reportColumns: AdminTableColumn<AdminReport>[] = [
  {
    header: "Subject",
    render: (report) => (
      <div>
        <Link href={reportSubjectHref(report)} className="font-semibold text-slate-100 hover:text-blue-200">
          {report.subjectLabel}
        </Link>
        <p className="mt-1 text-slate-500">{report.reason}</p>
      </div>
    ),
  },
  { header: "Type", render: (report) => report.type },
  {
    header: "Severity",
    render: (report) => <AdminStatusBadge label={report.severity} tone={severityTone(report.severity)} />,
  },
  { header: "Status", render: (report) => report.status },
  { header: "Assigned", render: (report) => report.assignedTo },
  { header: "Created", render: (report) => report.createdAt },
  {
    header: "Actions",
    render: (report) => (
      <AdminActionMenu
        actions={[
          { label: "Inspect", href: reportSubjectHref(report), tone: "blue" },
          { label: "Escalate", href: `/admin/reports?case=${report.id}&action=escalate`, tone: "red" },
          { label: "Resolve", href: `/admin/reports?case=${report.id}&action=resolve`, tone: "neutral" },
        ]}
      />
    ),
  },
];

const actionColumns: AdminTableColumn<AdminAuditLog>[] = [
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
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Abuse and issues center
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Reports
        </h1>
        <p className="max-w-3xl text-xs leading-5 text-slate-500">
          Reported partner-owned hotels, users, and reviews with severity
          indicators, moderation queue status, and action history.
        </p>
      </div>

      <AdminFilters
        filters={[
          { label: "All", href: "/admin/reports", active: true, count: adminReports.length },
          { label: "Hotel reports", href: "/admin/reports?type=hotel", count: 2, tone: "amber" },
          { label: "Users", href: "/admin/reports?type=user", count: 1, tone: "red" },
          { label: "Reviews", href: "/admin/reports?type=review", count: 1 },
          { label: "Critical", href: "/admin/reports?severity=critical", count: 1, tone: "red" },
        ]}
      />

      <AdminSection title="Moderation queue">
        <AdminTable rows={adminReports} columns={reportColumns} getRowKey={(report) => report.id} />
      </AdminSection>

      <AdminSection title="Action history">
        <AdminTable rows={adminAuditLogs} columns={actionColumns} getRowKey={(log) => log.id} />
      </AdminSection>
    </>
  );
}
