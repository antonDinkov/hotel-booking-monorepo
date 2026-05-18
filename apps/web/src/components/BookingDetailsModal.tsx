"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { AppButton } from "./AppButton";
import type { BookingCancellationNotice, MyBooking } from "@/types/booking";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: MyBooking | null;
  onCancelBooking?: (bookingId: string) => void | Promise<void>;
  onSubmitReview?: (bookingId: string, rating: number, comment: string) => void | Promise<void>;
  isCancelling?: boolean;
  isSubmittingReview?: boolean;
  notice?: BookingCancellationNotice | null;
  noticeTone?: "success" | "error";
}

export function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  onCancelBooking,
  onSubmitReview,
  isCancelling = false,
  isSubmittingReview = false,
  notice = null,
  noticeTone = "success",
}: BookingDetailsModalProps) {
  const [reviewFormBookingId, setReviewFormBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (!booking) return null;
  const isReviewFormOpen = reviewFormBookingId === booking.id;

  const handleCancelBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    void onCancelBooking?.(booking.id);
  };

  const handleOpenReviewForm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRating(5);
    setComment("");
    setReviewFormBookingId(booking.id);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmitReview?.(booking.id, rating, comment);
  };

  const handleClose = () => {
    setReviewFormBookingId(null);
    onClose();
  };

  const isCancelActionDisabled =
    isCancelling ||
    noticeTone === "error";
  const showReviewSubmitted = booking.hasReview && !booking.canReview;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-slate-900">
                    Booking Details
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Close modal"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-4">
                  {booking.hotelImage && (
                    <Image
                      src={booking.hotelImage}
                      alt={booking.hotelName}
                      width={384}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Hotel</h4>
                      <p className="text-sm text-slate-600">{booking.hotelName}</p>
                      {booking.hotelAddress && (
                        <p className="text-sm text-slate-500">{booking.hotelAddress}</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Room Type</h4>
                      <p className="text-sm text-slate-600">{booking.roomType}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Check-in</h4>
                        <p className="text-sm text-slate-600">{booking.checkIn}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Check-out</h4>
                        <p className="text-sm text-slate-600">{booking.checkOut}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Total Price</h4>
                      <p className="text-sm text-slate-600">${booking.totalPrice}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Status</h4>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold tracking-wide ${
                        booking.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : booking.status === "active"
                          ? "bg-blue-100 text-blue-800"
                          : booking.status === "upcoming"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {booking.status === "cancelled" ? booking.cancelledBadge ?? "Cancelled" : booking.status}
                      </span>
                    </div>
                  </div>
                </div>

                {booking.canReview && isReviewFormOpen && (
                  <form className="mt-5 space-y-4" onSubmit={handleSubmitReview}>
                    <div>
                      <label htmlFor="review-rating" className="text-sm font-semibold text-slate-900">
                        Rating
                      </label>
                      <select
                        id="review-rating"
                        value={rating}
                        onChange={(event) => setRating(Number(event.target.value))}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value={5}>5 - Excellent</option>
                        <option value={4}>4 - Very good</option>
                        <option value={3}>3 - Good</option>
                        <option value={2}>2 - Fair</option>
                        <option value={1}>1 - Poor</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="review-comment" className="text-sm font-semibold text-slate-900">
                        Comment
                      </label>
                      <textarea
                        id="review-comment"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        maxLength={2000}
                        rows={4}
                        className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <AppButton
                      variant="primary"
                      size="sm"
                      type="submit"
                      disabled={isSubmittingReview}
                      className="w-full"
                    >
                      {isSubmittingReview ? "Submitting..." : "Submit Review"}
                    </AppButton>
                  </form>
                )}

                {notice && (
                  <div className={`mt-5 rounded-lg p-3 text-sm ${
                    noticeTone === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    <p className="font-semibold">{notice.title}</p>
                    <p className="mt-1">{notice.message}</p>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  {booking.status === "upcoming" || booking.status === "active" ? (
                    <AppButton
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelBooking}
                      disabled={isCancelActionDisabled}
                      className="flex-1"
                    >
                      {isCancelling ? "Cancelling..." : "Cancel Booking"}
                    </AppButton>
                  ) : booking.status === "cancelled" ? null : showReviewSubmitted ? (
                    <AppButton variant="secondary" size="sm" disabled className="flex-1">
                      Review Submitted
                    </AppButton>
                  ) : booking.canReview && !isReviewFormOpen ? (
                    <AppButton
                      variant="primary"
                      size="sm"
                      onClick={handleOpenReviewForm}
                      className="flex-1"
                    >
                      Leave Review
                    </AppButton>
                  ) : null}
                  {isReviewFormOpen && (
                    <AppButton variant="ghost" size="sm" onClick={() => setReviewFormBookingId(null)}>
                      Cancel
                    </AppButton>
                  )}
                  {booking.status === "cancelled" ? (
                    <AppButton variant="ghost" size="sm" onClick={handleClose} className="flex-1">
                      Close
                    </AppButton>
                  ) : (
                    <AppButton variant="ghost" size="sm" onClick={handleClose}>
                      Close
                    </AppButton>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
