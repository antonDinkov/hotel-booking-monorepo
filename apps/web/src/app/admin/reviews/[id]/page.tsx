import { notFound, redirect } from "next/navigation";

import AdminReviewDetailClient from "@/components/admin/AdminReviewDetailClient";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { parseAdminReviewId } from "@/lib/admin-review-validation";
import { getAdminReviewDetails } from "@/server/services/adminReviews";
import type { AdminDetailPageProps } from "@/types/admin";

async function requireAdmin() {
  const auth = await authorize(["admin"]);
  if (!auth.ok) redirect("/admin/login");
}

export default async function Page({ params }: AdminDetailPageProps) {
  await requireAdmin();

  let reviewId: number;
  try {
    reviewId = parseAdminReviewId((await params).id);
  } catch {
    notFound();
  }

  const review = await getAdminReviewDetails(reviewId);
  if (!review) notFound();

  return <AdminReviewDetailClient review={review} />;
}
