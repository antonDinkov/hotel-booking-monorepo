import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

import { formatReviewDate } from "@/lib/review-format";
import type { PartnerReviewReply } from "@/types/review";

interface ReviewReplyProps {
  reply: PartnerReviewReply;
}

export default function ReviewReply({ reply }: ReviewReplyProps) {
  return (
    <div className="mt-4 border-l-2 border-blue-200 bg-blue-50/70 py-3 pl-4 pr-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-800">
        <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden />
        Partner reply
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-700">{reply.comment}</p>
      <p className="mt-2 text-xs text-slate-500">
        {reply.repliedByName ?? "Hotel partner"} replied on {formatReviewDate(reply.repliedAt)}
      </p>
    </div>
  );
}
