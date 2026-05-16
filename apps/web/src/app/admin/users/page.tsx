import Link from "next/link";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import { accountStatusTone } from "@/lib/admin-display";
import { adminUsers } from "@/lib/admin-mock-data";
import type { AdminTableColumn, AdminUser } from "@/types/admin";

const userColumns: AdminTableColumn<AdminUser>[] = [
  {
    header: "User",
    render: (user) => (
      <div>
        <Link href={`/admin/users/${user.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
          {user.name}
        </Link>
        <p className="mt-1 text-slate-500">{user.email}</p>
      </div>
    ),
  },
  {
    header: "Role",
    render: (user) => <AdminStatusBadge label={user.role} tone={user.role === "admin" ? "red" : "neutral"} />,
  },
  {
    header: "Status",
    render: (user) => <AdminStatusBadge label={user.status} tone={accountStatusTone(user.status)} />,
  },
  { header: "Bookings", render: (user) => user.bookings },
  {
    header: "Risk",
    render: (user) => (
      <span className={user.riskScore >= 70 ? "font-semibold text-red-200" : "text-slate-400"}>
        {user.riskScore}
      </span>
    ),
  },
  { header: "Last active", render: (user) => user.lastActive },
  {
    header: "Actions",
    render: (user) => (
      <AdminActionMenu
        actions={[
          { label: "Inspect", href: `/admin/users/${user.id}`, tone: "blue" },
          { label: "Suspend", href: `/admin/users/${user.id}?action=suspend`, tone: "red" },
          { label: "Activate", href: `/admin/users/${user.id}?action=activate`, tone: "neutral" },
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
          Identity and account operations
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          User management
        </h1>
        <p className="max-w-3xl text-xs leading-5 text-slate-500">
          Static table scaffold for account status, roles, risk signals, and
          moderation actions.
        </p>
      </div>

      <AdminFilters
        filters={[
          { label: "All", href: "/admin/users", active: true, count: adminUsers.length },
          { label: "Clients", href: "/admin/users?role=client", count: 3 },
          { label: "Partners", href: "/admin/users?role=partner", count: 2 },
          { label: "Suspended", href: "/admin/users?status=suspended", count: 1, tone: "red" },
          { label: "Review", href: "/admin/users?status=under_review", count: 2, tone: "amber" },
        ]}
      />

      <AdminSection title="Users table" description="Dense operational account list with future-ready row actions.">
        <AdminTable rows={adminUsers} columns={userColumns} getRowKey={(user) => user.id} />
      </AdminSection>
    </>
  );
}
