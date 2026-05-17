import { redirect } from "next/navigation";

import AdminAnalyticsClient from "@/components/admin/AdminAnalyticsClient";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { parseAdminReportFilters } from "@/lib/admin-report-validation";
import { getAdminAnalytics } from "@/server/services/adminAnalytics";

type AdminAnalyticsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function requireAdmin() {
  const auth = await authorize(["admin"]);
  if (!auth.ok) redirect("/admin/login");
}

export default async function Page({ searchParams }: AdminAnalyticsPageProps) {
  await requireAdmin();

  let filters;
  try {
    filters = parseAdminReportFilters(await searchParams);
  } catch {
    return (
      <>
        <AnalyticsPageHeader />
        <AdminSection title="Invalid range">
          <AdminPanel className="p-4 text-xs leading-6 text-red-200">
            The current analytics query contains an invalid date range.
          </AdminPanel>
        </AdminSection>
      </>
    );
  }

  const result = await getAdminAnalytics(filters);

  return (
    <>
      <AnalyticsPageHeader />
      <AdminAnalyticsClient result={result} />
    </>
  );
}

function AnalyticsPageHeader() {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
        Platform intelligence
      </p>
      <h1 className="text-xl font-semibold tracking-tight text-slate-50">
        Analytics
      </h1>
      <p className="max-w-3xl text-xs leading-5 text-slate-500">
        Database-backed platform analytics for users, partners, hotels, room
        inventory, bookings, payment status, revenue, occupancy, and reviews.
      </p>
    </div>
  );
}
