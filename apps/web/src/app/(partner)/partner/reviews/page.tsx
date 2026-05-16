import { ChatBubbleLeftRightIcon, StarIcon } from "@heroicons/react/24/outline";
import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import { partnerReviews } from "@/lib/partner-mock-data";

const filters = ["Unanswered", "Low ratings", "Newest"];

export default function Page() {
  return (
    <>
      <PartnerPageHeader
        eyebrow="Guest feedback"
        title="Reviews"
        description="Review cards with visual filters, guest context, rating, comment, and a static reply area."
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={[
              "rounded-lg border px-4 py-2 text-sm font-semibold transition",
              filter === "Unanswered"
                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                : "border-white/10 text-slate-300 hover:bg-white/[0.06]",
            ].join(" ")}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid gap-5">
        {partnerReviews.map((review) => (
          <PartnerCard key={review.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">{review.guest}</h2>
                  <PartnerBadge tone={review.status === "Unanswered" ? "amber" : "slate"}>
                    {review.status}
                  </PartnerBadge>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {review.hotel} - {review.date}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-200">
                <StarIcon className="h-4 w-4" aria-hidden="true" />
                {review.rating}
              </span>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">{review.comment}</p>
            <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/40 p-4">
              <label className="grid gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
                  Reply area
                </span>
                <textarea
                  className="min-h-24 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300/60"
                  placeholder="Write a professional partner response..."
                />
              </label>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                >
                  Preview reply
                </button>
              </div>
            </div>
          </PartnerCard>
        ))}
      </div>
    </>
  );
}
