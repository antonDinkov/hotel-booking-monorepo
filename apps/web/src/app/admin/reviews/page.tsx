import { redirect } from "next/navigation";

import AdminPanel from "@/components/admin/AdminPanel";
import AdminReviewsClient from "@/components/admin/AdminReviewsClient";
import AdminSection from "@/components/admin/AdminSection";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { parseAdminReviewFilters } from "@/lib/admin-review-validation";
import { listAdminReviews } from "@/server/services/adminReviews";

type AdminReviewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function requireAdmin() {
  const auth = await authorize(["admin"]);
  if (!auth.ok) redirect("/admin/login");
}

export default async function Page({ searchParams }: AdminReviewsPageProps) {
  await requireAdmin();

  let filters;
  try {
    filters = parseAdminReviewFilters(await searchParams);
  } catch {
    return (
      <>
        <ReviewsPageHeader />
        <AdminSection title="Invalid filters">
          <AdminPanel className="p-4 text-xs leading-6 text-red-200">
            The current reviews query contains invalid hotel, partner, rating,
            moderation, reply, date, sort, or pagination values.
          </AdminPanel>
        </AdminSection>
      </>
    );
  }

  const result = await listAdminReviews(filters);

  return (
    <>
      <ReviewsPageHeader />
      <AdminReviewsClient result={result} />
    </>
  );
}

function ReviewsPageHeader() {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
        Content operations
      </p>
      <h1 className="text-xl font-semibold tracking-tight text-slate-50">
        Review moderation
      </h1>
      <p className="max-w-3xl text-xs leading-5 text-slate-500">
        Database-backed review moderation across every hotel, partner, booking,
        and guest account.
      </p>
    </div>
  );
}
