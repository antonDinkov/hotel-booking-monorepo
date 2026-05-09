"use client";

import { useState } from "react";
import { MyBookingCard } from "@/components/MyBookingCard";
import { BookingDetailsModal } from "@/components/BookingDetailsModal";
import { AppButton } from "@/components/AppButton";
import type { MyBooking } from "@/types/booking";

interface BookingsClientProps {
  activeBooking: MyBooking | null;
  inactiveBookings: MyBooking[];
}

const BOOKINGS_PER_PAGE = 3;

export function BookingsClient({ activeBooking, inactiveBookings }: BookingsClientProps) {
    const [selectedBooking, setSelectedBooking] = useState<MyBooking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(inactiveBookings.length / BOOKINGS_PER_PAGE);
    const startIndex = (currentPage - 1) * BOOKINGS_PER_PAGE;
    const endIndex = startIndex + BOOKINGS_PER_PAGE;
    const paginatedBookings = inactiveBookings.slice(startIndex, endIndex);

    const handleCardClick = (booking: MyBooking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedBooking(null);
    };

    const handleCancelBooking = (bookingId: string) => {
        // TODO: Implement cancel booking logic
        console.log("Cancel booking:", bookingId);
        handleCloseModal();
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
            {activeBooking && (
                <section className="mb-10">
                    <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">
                        Active Booking
                    </h2>
                    <div className="rounded-3xl border-2 border-blue-200 bg-blue-50 p-1 shadow-md">
                        <MyBookingCard
                            {...activeBooking}
                            onCardClick={() => handleCardClick(activeBooking)}
                        />
                    </div>
                </section>
            )}

            {/* Inactive Bookings List */}
            <section>
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">
                    {activeBooking ? "Other Bookings" : "All Bookings"}
                </h2>

                {inactiveBookings.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                        <p className="text-slate-600">
                            {activeBooking ? "No other bookings yet." : "No bookings yet."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            {paginatedBookings.map((booking) => (
                                <MyBookingCard
                                    key={booking.id}
                                    {...booking}
                                    onCardClick={() => handleCardClick(booking)}
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
            />
        </>
    );
}