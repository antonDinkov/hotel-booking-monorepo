import { redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import ReviewList from "@/components/reviews/ReviewList";
import { getMyReviews } from "@/server/services/reviews";

export default async function MyReviewsPage() {
  const auth = await authorize(["client"]);

  if (!auth.ok || !auth.userId) {
    redirect("/login");
  }

  const reviews = await getMyReviews(auth.userId);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold text-blue-700">Guest feedback</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">My Reviews</h1>
        <p className="mt-2 text-sm text-slate-600">
          {reviews.length} review{reviews.length === 1 ? "" : "s"} shared from completed stays.
        </p>
      </header>

      <ReviewList
        reviews={reviews}
        showHotelInfo
        emptyMessage="You have not reviewed any stays yet."
      />
    </main>
  );
}
