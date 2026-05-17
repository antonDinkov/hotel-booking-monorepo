import { redirect } from "next/navigation";

import AdminPanel from "@/components/admin/AdminPanel";
import AdminPartnersClient from "@/components/admin/AdminPartnersClient";
import AdminSection from "@/components/admin/AdminSection";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { parseAdminPartnerFilters } from "@/lib/admin-partner-validation";
import { listAdminPartners } from "@/server/services/adminPartners";

type AdminPartnersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function requireAdmin() {
  const auth = await authorize(["admin"]);
  if (!auth.ok) redirect("/admin/login");
}

export default async function Page({ searchParams }: AdminPartnersPageProps) {
  await requireAdmin();

  let filters;
  try {
    filters = parseAdminPartnerFilters(await searchParams);
  } catch {
    return (
      <>
        <PartnersPageHeader />
        <AdminSection title="Invalid filters">
          <AdminPanel className="p-4 text-xs leading-6 text-red-200">
            The current partners query contains invalid filter, sort, date, or
            pagination values.
          </AdminPanel>
        </AdminSection>
      </>
    );
  }

  const result = await listAdminPartners(filters);

  return (
    <>
      <PartnersPageHeader />
      <AdminPartnersClient result={result} />
    </>
  );
}

function PartnersPageHeader() {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
        Partner operations
      </p>
      <h1 className="text-xl font-semibold tracking-tight text-slate-50">
        Partner management
      </h1>
      <p className="max-w-3xl text-xs leading-5 text-slate-500">
        Database-backed partner verification, portfolio ownership, and partner
        activity totals.
      </p>
    </div>
  );
}
