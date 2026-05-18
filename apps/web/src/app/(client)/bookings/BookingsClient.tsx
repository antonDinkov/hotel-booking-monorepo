"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MyBookingCard } from "@/components/MyBookingCard";
import { BookingDetailsModal } from "@/components/BookingDetailsModal";
import { Pagination } from "@/components/Pagination";
import type {
  BookingCancellationNotice,
  BookingPaymentMethod,
  BookingPaymentStatus,
  CancelBookingResult,
  CancelledBookingBadge,
  ClientBookingsPagination,
  MyBooking,
} from "@/types/booking";
import type { Review } from "@/types/review";

interface BookingsClientProps {
  activeBooking: MyBooking | null;
  inactiveBookings: MyBooking[];
  pagination?: ClientBookingsPagination;
}

type CancelBookingPayload = {
    data?: CancelBookingResult;
    error?: {
        code?: string;
        message?: string;
    };
};

type ReviewPayload = {
    data?: Review;
    error?: {
        code?: string;
        message?: string;
    };
};

function getCancelledBadge(
    paymentMethod: BookingPaymentMethod | null,
    paymentStatus: BookingPaymentStatus
): CancelledBookingBadge | undefined {
    if (paymentMethod === "cash_on_arrival" && paymentStatus === "cancelled") return "Cancelled";
    if (paymentMethod === "stripe" && paymentStatus === "refunded") return "Cancelled · Refunded";
    if (paymentMethod === "stripe" && paymentStatus === "refund_denied") return "Cancelled · Without refund";
    if (paymentMethod === "stripe" && paymentStatus === "refund_pending") return "Cancelled · Refund pending";
    return undefined;
}

function getErrorNotice(error?: CancelBookingPayload["error"]): BookingCancellationNotice {
    if (error?.code === "BOOKING_ALREADY_STARTED") {
        return {
            title: "Booking cannot be cancelled",
            message: error.message ?? "This booking has already started and cannot be cancelled automatically. Please contact support or the hotel.",
        };
    }

    if (error?.code === "BOOKING_REFUND_PAYMENT_INTENT_MISSING" || error?.code === "STRIPE_REFUND_FAILED") {
        return {
            title: "Refund failed",
            message: "Please contact support.",
        };
    }

    return {
        title: "Cancellation failed",
        message: error?.message ?? "Please contact support.",
    };
}

function getReviewErrorNotice(error?: ReviewPayload["error"]): BookingCancellationNotice {
    if (error?.code === "BOOKING_NOT_COMPLETED") {
        return {
            title: "Review unavailable",
            message: error.message ?? "Only completed bookings can be reviewed.",
        };
    }

    if (error?.code === "REVIEW_ALREADY_EXISTS") {
        return {
            title: "Review already submitted",
            message: error.message ?? "This booking already has a review.",
        };
    }

    return {
        title: "Review failed",
        message: error?.message ?? "Please try again later.",
    };
}

function getSortPriority(booking: MyBooking): number {
    if (booking.status === "cancelled") return 2;
    if (booking.status === "past") return 1;
    return 0;
}

function sortBookings(bookings: MyBooking[]): MyBooking[] {
    return [...bookings].sort((a, b) => {
        const priorityDifference = getSortPriority(a) - getSortPriority(b);
        if (priorityDifference !== 0) return priorityDifference;
        return new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime();
    });
}

function toCancelledBooking(booking: MyBooking, result: CancelBookingResult): MyBooking {
    return {
        ...booking,
        status: "cancelled",
        lifecycleStatus: "cancelled",
        paymentMethod: result.paymentMethod,
        paymentStatus: result.paymentStatus,
        cancelledBadge: getCancelledBadge(result.paymentMethod, result.paymentStatus),
        canCancel: false,
        daysRemaining: undefined,
    };
}

function toReviewedBooking(booking: MyBooking, review: Review): MyBooking {
    return {
        ...booking,
        hasReview: true,
        canReview: false,
        reviewId: review.id,
    };
}

export function BookingsClient({ activeBooking, inactiveBookings, pagination }: BookingsClientProps) {
    const router = useRouter();
    const [currentActiveBooking, setCurrentActiveBooking] = useState(activeBooking);
    const [currentInactiveBookings, setCurrentInactiveBookings] = useState(inactiveBookings);
    const [selectedBooking, setSelectedBooking] = useState<MyBooking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [actionNotice, setActionNotice] = useState<BookingCancellationNotice | null>(null);
    const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");

    useEffect(() => {
        setCurrentActiveBooking(activeBooking);
        setCurrentInactiveBookings(inactiveBookings);
    }, [activeBooking, inactiveBookings]);

    const handleCardClick = (booking: MyBooking) => (e?: React.MouseEvent) => {
        e?.stopPropagation?.();
        e?.preventDefault?.();
        setSelectedBooking(booking);
        setActionNotice(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedBooking(null);
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (isCancelling) return;

        const booking = selectedBooking;
        setIsCancelling(true);
        setActionNotice(null);

        try {
            const response = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "PATCH" });
            const payload = await response.json().catch(() => null) as CancelBookingPayload | null;

            if (!response.ok || !payload?.data) {
                setNoticeTone("error");
                setActionNotice(getErrorNotice(payload?.error));
                return;
            }

            if (booking) {
                const cancelledBooking = toCancelledBooking(booking, payload.data);
                if (currentActiveBooking?.id === bookingId) {
                    setCurrentActiveBooking(null);
                    setCurrentInactiveBookings((items) => sortBookings([...items, cancelledBooking]));
                } else {
                    setCurrentInactiveBookings((items) => sortBookings(
                        items.map((item) => item.id === bookingId ? cancelledBooking : item)
                    ));
                }
            }

            setNoticeTone("success");
            setActionNotice(payload.data.notification);
            handleCloseModal();
            router.refresh();
        } catch {
            setNoticeTone("error");
            setActionNotice({ title: "Cancellation failed", message: "Please contact support." });
        } finally {
            setIsCancelling(false);
        }
    };

    const handleSubmitReview = async (bookingId: string, rating: number, comment: string) => {
        if (isSubmittingReview) return;

        const booking = selectedBooking;
        setIsSubmittingReview(true);
        setActionNotice(null);

        try {
            const response = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId: Number(bookingId),
                    rating,
                    comment: comment.trim() || null,
                }),
            });
            const payload = await response.json().catch(() => null) as ReviewPayload | null;

            if (!response.ok || !payload?.data) {
                setNoticeTone("error");
                setActionNotice(getReviewErrorNotice(payload?.error));
                return;
            }

            if (booking) {
                const reviewedBooking = toReviewedBooking(booking, payload.data);
                setSelectedBooking(reviewedBooking);
                setCurrentInactiveBookings((items) => items.map((item) => (
                    item.id === bookingId ? reviewedBooking : item
                )));

                if (currentActiveBooking?.id === bookingId) {
                    setCurrentActiveBooking(reviewedBooking);
                }
            }

            setNoticeTone("success");
            setActionNotice({
                title: "Review submitted",
                message: "Your review has been published.",
            });
            router.refresh();
        } catch {
            setNoticeTone("error");
            setActionNotice({ title: "Review failed", message: "Please try again later." });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const effectivePagination = pagination ?? {
        page: 1,
        pageSize: currentInactiveBookings.length,
        totalItems: currentInactiveBookings.length,
        totalPages: 1,
    };

    const handlePageChange = (page: number) => {
        const safePage = Math.max(1, Math.min(page, effectivePagination.totalPages));
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(safePage));
        router.push(`/bookings?${params.toString()}`);
    };

    return (
        <>
            {/* Active Booking Section */}
            {actionNotice && !isModalOpen && (
                <div className={`mb-6 rounded-xl p-4 text-sm ${
                    noticeTone === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                }`}>
                    <p className="font-semibold">{actionNotice.title}</p>
                    <p className="mt-1">{actionNotice.message}</p>
                </div>
            )}

            {currentActiveBooking && (
                <section className="mb-10">
                    <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">
                        Active Booking
                    </h2>
                    <div className="rounded-3xl border-2 border-blue-200 bg-blue-50 p-1 shadow-md">
                        <MyBookingCard
                            {...currentActiveBooking}
                            onCardClick={handleCardClick(currentActiveBooking)}
                        />
                    </div>
                </section>
            )}

            {/* Inactive Bookings List */}
            <section>
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">
                    {currentActiveBooking ? "Other Bookings" : "All Bookings"}
                </h2>

                {currentInactiveBookings.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                        <p className="text-slate-600">
                            {currentActiveBooking ? "No other bookings yet." : "No bookings yet."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            {currentInactiveBookings.map((booking) => (
                                <MyBookingCard
                                    key={booking.id}
                                    {...booking}
                                    onCardClick={handleCardClick(booking)}
                                />
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        <Pagination
                            currentPage={effectivePagination.page}
                            totalPages={effectivePagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </section>

            <BookingDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                booking={selectedBooking}
                onCancelBooking={handleCancelBooking}
                onSubmitReview={handleSubmitReview}
                isCancelling={isCancelling}
                isSubmittingReview={isSubmittingReview}
                notice={isModalOpen ? actionNotice : null}
                noticeTone={noticeTone}
            />
        </>
    );
}
