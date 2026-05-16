import Link from "next/link";
import { notFound } from "next/navigation";

import ShiningStarBadge from "@/components/ShiningStarBadge";
import LoadMoreReviewList from "@/components/reviews/LoadMoreReviewList";
import { getHotelReviewsPageData } from "@/server/services/reviews";

const INITIAL_REVIEW_LIMIT = 3;

interface Props {
  params: { id: string } | Promise<{ id: string }>;
}

function parseHotelId(id: string): number | null {
  const hotelId = Number(id);
  return Number.isInteger(hotelId) && hotelId > 0 ? hotelId : null;
}

export default async function HotelReviewsPage({ params }: Props) {
  const resolvedParams = await params;
  const hotelId = parseHotelId(resolvedParams.id);

  if (!hotelId) notFound();

  const pageData = await getHotelReviewsPageData(hotelId, {
    limit: INITIAL_REVIEW_LIMIT,
    offset: 0,
  });

  if (!pageData) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/listings/${pageData.hotel.id}`}
        className="text-sm font-semibold text-blue-700 hover:text-blue-800"
      >
        Back to property
      </Link>

      <header className="mt-6 border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold text-blue-700">{pageData.hotel.location}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Reviews for {pageData.hotel.name}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-2xl font-semibold text-slate-950">{pageData.summary.ratingLabel}</span>
          <span className="text-sm text-slate-600">{pageData.summary.reviewLabel}</span>
          <ShiningStarBadge badge={pageData.summary.trustBadge} />
        </div>
      </header>

      <section className="mt-8">
        <LoadMoreReviewList
          hotelId={pageData.hotel.id}
          initialReviews={pageData.reviews}
          initialPagination={pageData.pagination}
        />
      </section>
    </main>
  );
}
