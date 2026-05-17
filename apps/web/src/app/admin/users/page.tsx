import { redirect } from "next/navigation";

import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminUsersClient from "@/components/admin/AdminUsersClient";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { parseAdminUserFilters } from "@/lib/admin-user-validation";
import { listAdminUsers } from "@/server/services/adminUsers";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function requireAdmin() {
  const auth = await authorize(["admin"]);
  if (!auth.ok) redirect("/admin/login");
}

export default async function Page({ searchParams }: AdminUsersPageProps) {
  await requireAdmin();

  let filters;
  try {
    filters = parseAdminUserFilters(await searchParams);
  } catch {
    return (
      <>
        <UsersPageHeader />
        <AdminSection title="Invalid filters">
          <AdminPanel className="p-4 text-xs leading-6 text-red-200">
            The current users query contains invalid filter, sort, date, or
            pagination values.
          </AdminPanel>
        </AdminSection>
      </>
    );
  }

  const result = await listAdminUsers(filters);

  return (
    <>
      <UsersPageHeader />
      <AdminUsersClient result={result} />
    </>
  );
}

function UsersPageHeader() {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
        Identity and account operations
      </p>
      <h1 className="text-xl font-semibold tracking-tight text-slate-50">
        User management
      </h1>
      <p className="max-w-3xl text-xs leading-5 text-slate-500">
        Database-backed account status, roles, profile data, and user activity
        totals.
      </p>
    </div>
  );
}
