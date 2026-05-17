import { redirect } from "next/navigation";

import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminSettingsClient from "@/components/admin/AdminSettingsClient";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { getAdminAccountSettings } from "@/server/services/adminSettings";

async function requireAdmin() {
  const auth = await authorize(["admin"]);
  if (!auth.ok || !auth.userId) redirect("/admin/login");
  return auth.userId;
}

export default async function Page() {
  const userId = await requireAdmin();
  const settings = await getAdminAccountSettings(userId);

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
            Database-backed admin profile settings with read-only security,
            role, and notification information from the existing account model.
          </p>
        </div>
        <AdminActionMenu
          actions={[
            { label: "System", href: "/admin/system", tone: "neutral" },
            { label: "Users", href: "/admin/users", tone: "blue" },
          ]}
        />
      </div>

      <AdminSettingsClient initialSettings={settings} />
    </>
  );
}
