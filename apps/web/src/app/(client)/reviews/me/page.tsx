import { redirect } from "next/navigation";
import Link from "next/link";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import ReviewList from "@/components/reviews/ReviewList";
import { getMyReviewsPage } from "@/server/services/reviews";

type MyReviewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildPageHref(page: number) {
  return `/reviews/me?page=${page}`;
}

export default async function MyReviewsPage({ searchParams }: MyReviewsPageProps) {
  const auth = await authorize(["client"]);

  if (!auth.ok || !auth.userId) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const pageParam = Array.isArray(resolvedSearchParams.page) ? resolvedSearchParams.page[0] : resolvedSearchParams.page;
  const page = Number(pageParam);
  const result = await getMyReviewsPage(auth.userId, {
    page: Number.isInteger(page) && page > 0 ? page : 1,
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold text-blue-700">Guest feedback</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">My Reviews</h1>
        <p className="mt-2 text-sm text-slate-600">
          {result.pagination.totalItems} review{result.pagination.totalItems === 1 ? "" : "s"} shared from completed stays.
        </p>
      </header>

      <ReviewList
        reviews={result.reviews}
        showHotelInfo
        emptyMessage="You have not reviewed any stays yet."
      />

      {result.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={buildPageHref(Math.max(1, result.pagination.page - 1))}
            className={`rounded-md px-3 py-1 text-sm font-medium text-slate-700 ${
              result.pagination.page === 1 ? "pointer-events-none opacity-50" : "hover:bg-slate-100"
            }`}
          >
            Prev
          </Link>
          <span className="text-sm text-slate-600">
            Page {result.pagination.page} of {result.pagination.totalPages}
          </span>
          <Link
            href={buildPageHref(Math.min(result.pagination.totalPages, result.pagination.page + 1))}
            className={`rounded-md px-3 py-1 text-sm font-medium text-slate-700 ${
              result.pagination.page === result.pagination.totalPages ? "pointer-events-none opacity-50" : "hover:bg-slate-100"
            }`}
          >
            Next
          </Link>
        </div>
      )}
    </main>
  );
}
