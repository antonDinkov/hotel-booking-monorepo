"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AppButton } from "./AppButton";
import type { MyBooking } from "@/types/booking";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: MyBooking | null;
  onCancelBooking?: (bookingId: string) => void;
  onLeaveReview?: (bookingId: string) => void;
}

export function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  onCancelBooking,
  onLeaveReview,
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const handleCancelBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancelBooking?.(booking.id);
  };

  const handleLeaveReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLeaveReview?.(booking.id);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-4">
                  {booking.hotelImage && (
                    <img
                      src={booking.hotelImage}
                      alt={booking.hotelName}
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
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
                        booking.status === "active"
                          ? "bg-blue-100 text-blue-800"
                          : booking.status === "upcoming"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  {booking.status === "upcoming" || booking.status === "active" ? (
                    <AppButton
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelBooking}
                      className="flex-1"
                    >
                      Cancel Booking
                    </AppButton>
                  ) : (
                    <AppButton
                      variant="primary"
                      size="sm"
                      onClick={handleLeaveReview}
                      className="flex-1"
                    >
                      Leave Review
                    </AppButton>
                  )}
                  <AppButton variant="ghost" size="sm" onClick={onClose}>
                    Close
                  </AppButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}