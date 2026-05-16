import Link from "next/link";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";

const settingsSections = [
  {
    title: "Moderation settings",
    rows: ["Critical reports require two-person review", "Auto-hide reviews after 5 reports", "Partner evidence SLA set to 48 hours"],
  },
  {
    title: "Platform rules",
    rows: ["Off-platform payment requests are blocked", "New hotels require manual verification", "Suspended partners cannot receive payouts"],
  },
  {
    title: "Notification settings",
    rows: ["Critical report alerts to Trust Ops", "Failed payment digest every 2 hours", "System degradation messages pinned in topbar"],
  },
  {
    title: "Admin permissions",
    rows: ["Trust Ops can suspend hotels", "Finance can hold payouts", "Content can hide and restore reviews"],
  },
  {
    title: "Audit configuration",
    rows: ["All destructive actions require reason capture", "Audit log retention placeholder: 365 days", "Export destination not configured"],
  },
];

export default function Page() {
  return (
    <>
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Internal configuration
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
            Settings
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
            Static configuration surface for moderation rules, notifications,
            admin permissions, and audit behavior.
          </p>
        </div>
        <AdminActionMenu
          actions={[
            { label: "System", href: "/admin/system", tone: "neutral" },
            { label: "Audit logs", href: "/admin/system", tone: "blue" },
          ]}
        />
      </div>

      <AdminSection title="Configuration matrix">
        <div className="grid gap-4 xl:grid-cols-2">
          {settingsSections.map((section) => (
            <AdminPanel key={section.title} className="p-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-100">{section.title}</h2>
                <AdminStatusBadge label="mock" tone="neutral" />
              </div>
              <div className="mt-3 divide-y divide-slate-900">
                {section.rows.map((row) => (
                  <div key={row} className="flex items-center justify-between gap-4 py-2">
                    <p className="text-xs text-slate-400">{row}</p>
                    <Link
                      href={`/admin/settings?setting=${encodeURIComponent(row)}`}
                      className="shrink-0 border border-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-400 transition hover:border-slate-700 hover:text-slate-100"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            </AdminPanel>
          ))}
        </div>
      </AdminSection>
    </>
  );
}
