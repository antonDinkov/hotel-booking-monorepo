"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MyBookingCard } from "@/components/MyBookingCard";
import { BookingDetailsModal } from "@/components/BookingDetailsModal";
import { AppButton } from "@/components/AppButton";
import type {
  BookingCancellationNotice,
  BookingPaymentMethod,
  BookingPaymentStatus,
  CancelBookingResult,
  CancelledBookingBadge,
  MyBooking,
} from "@/types/booking";

interface BookingsClientProps {
  activeBooking: MyBooking | null;
  inactiveBookings: MyBooking[];
}

const BOOKINGS_PER_PAGE = 3;

type CancelBookingPayload = {
    data?: CancelBookingResult;
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

export function BookingsClient({ activeBooking, inactiveBookings }: BookingsClientProps) {
    const router = useRouter();
    const [currentActiveBooking, setCurrentActiveBooking] = useState(activeBooking);
    const [currentInactiveBookings, setCurrentInactiveBookings] = useState(inactiveBookings);
    const [selectedBooking, setSelectedBooking] = useState<MyBooking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancellationNotice, setCancellationNotice] = useState<BookingCancellationNotice | null>(null);
    const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");

    useEffect(() => {
        setCurrentActiveBooking(activeBooking);
        setCurrentInactiveBookings(inactiveBookings);
    }, [activeBooking, inactiveBookings]);

    const totalPages = Math.ceil(currentInactiveBookings.length / BOOKINGS_PER_PAGE);
    useEffect(() => {
        setCurrentPage((page) => Math.min(Math.max(page, 1), Math.max(totalPages, 1)));
    }, [totalPages]);

    const startIndex = (currentPage - 1) * BOOKINGS_PER_PAGE;
    const endIndex = startIndex + BOOKINGS_PER_PAGE;
    const paginatedBookings = currentInactiveBookings.slice(startIndex, endIndex);

    const handleCardClick = (booking: MyBooking) => (e?: React.MouseEvent) => {
        e?.stopPropagation?.();
        e?.preventDefault?.();
        setSelectedBooking(booking);
        setCancellationNotice(null);
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
        setCancellationNotice(null);

        try {
            const response = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "PATCH" });
            const payload = await response.json().catch(() => null) as CancelBookingPayload | null;

            if (!response.ok || !payload?.data) {
                setNoticeTone("error");
                setCancellationNotice(getErrorNotice(payload?.error));
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
            setCancellationNotice(payload.data.notification);
            handleCloseModal();
            router.refresh();
        } catch {
            setNoticeTone("error");
            setCancellationNotice({ title: "Cancellation failed", message: "Please contact support." });
        } finally {
            setIsCancelling(false);
        }
    };

    const handleLeaveReview = (bookingId: string) => {
        // TODO: Implement leave review logic
        console.log("Leave review for:", bookingId);
        handleCloseModal();
    };

    const handlePreviousPage = () => {
        setCurrentPage((p) => Math.max(1, p - 1));
    };

    const handleNextPage = () => {
        setCurrentPage((p) => Math.min(totalPages, p + 1));
    };

    return (
        <>
            {/* Active Booking Section */}
            {cancellationNotice && !isModalOpen && (
                <div className={`mb-6 rounded-xl p-4 text-sm ${
                    noticeTone === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                }`}>
                    <p className="font-semibold">{cancellationNotice.title}</p>
                    <p className="mt-1">{cancellationNotice.message}</p>
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
                            {paginatedBookings.map((booking) => (
                                <MyBookingCard
                                    key={booking.id}
                                    {...booking}
                                    onCardClick={handleCardClick(booking)}
                                />
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-between gap-4">
                                <AppButton
                                    variant="secondary"
                                    size="md"
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </AppButton>

                                <span className="text-sm text-slate-600">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <AppButton
                                    variant="secondary"
                                    size="md"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </AppButton>
                            </div>
                        )}
                    </>
                )}
            </section>

            <BookingDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                booking={selectedBooking}
                onCancelBooking={handleCancelBooking}
                onLeaveReview={handleLeaveReview}
                isCancelling={isCancelling}
                notice={isModalOpen ? cancellationNotice : null}
                noticeTone={noticeTone}
            />
        </>
    );
}
