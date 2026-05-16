import Link from "next/link";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import { reviewStatusTone } from "@/lib/admin-display";
import { adminReviews, partnerHotelHref } from "@/lib/admin-mock-data";
import type { AdminReviewCase, AdminTableColumn } from "@/types/admin";

const reviewColumns: AdminTableColumn<AdminReviewCase>[] = [
  {
    header: "Review",
    render: (review) => (
      <div>
        <p className="font-semibold text-slate-100">{review.excerpt}</p>
        <p className="mt-1 text-slate-500">{review.createdAt}</p>
      </div>
    ),
  },
  {
    header: "User",
    render: (review) => (
      <Link href={`/admin/users/${review.userId}`} className="hover:text-blue-200">
        {review.userName}
      </Link>
    ),
  },
  {
    header: "Hotel / partner",
    render: (review) => (
      <Link href={partnerHotelHref(review.hotelId)} className="hover:text-blue-200">
        {review.hotelName}
      </Link>
    ),
  },
  { header: "Rating", render: (review) => `${review.rating}/5` },
  {
    header: "Status",
    render: (review) => <AdminStatusBadge label={review.status} tone={reviewStatusTone(review.status)} />,
  },
  {
    header: "Reports",
    render: (review) => (
      <span className={review.reportCount > 3 ? "font-semibold text-red-200" : "text-slate-400"}>
        {review.reportCount}
      </span>
    ),
  },
  {
    header: "Actions",
    render: (review) => (
      <AdminActionMenu
        actions={[
          { label: "Inspect", href: `/admin/reviews?case=${review.id}`, tone: "blue" },
          { label: "Hide", href: `/admin/reviews?case=${review.id}&action=hide`, tone: "red" },
          { label: "Restore", href: `/admin/reviews?case=${review.id}&action=restore`, tone: "neutral" },
        ]}
      />
    ),
  },
];

export default function Page() {
  return (
    <>
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Content operations
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Review moderation
        </h1>
        <p className="max-w-3xl text-xs leading-5 text-slate-500">
          Static moderation queue for reported, low-rating, hidden, and pending
          reviews.
        </p>
      </div>

      <AdminFilters
        filters={[
          { label: "Reported", href: "/admin/reviews?filter=reported", active: true, count: 1, tone: "red" },
          { label: "Low rating", href: "/admin/reviews?filter=low_rating", count: 1, tone: "amber" },
          { label: "Hidden", href: "/admin/reviews?filter=hidden", count: 1, tone: "red" },
          { label: "Pending", href: "/admin/reviews?filter=pending", count: 1, tone: "amber" },
        ]}
      />

      <AdminSection title="Moderation queue" description="Review cases with status, reporter volume, and static action controls.">
        <AdminTable rows={adminReviews} columns={reviewColumns} getRowKey={(review) => review.id} />
      </AdminSection>
    </>
  );
}
