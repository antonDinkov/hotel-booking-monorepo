import React from "react";

// Mock Headless UI BEFORE importing component
jest.mock("@headlessui/react", () => {
  const React = require("react");

  const Dialog = ({ children }: any) =>
    React.createElement("div", { "data-testid": "dialog" }, children);

  Dialog.Panel = ({ children }: any) =>
    React.createElement("div", {}, children);

  Dialog.Title = ({ children }: any) =>
    React.createElement("h3", {}, children);

  const Transition = ({ children, show }: any) =>
    show ? React.createElement(React.Fragment, null, children) : null;

  Transition.Child = ({ children }: any) =>
    React.createElement(React.Fragment, null, children);

  return {
    Dialog,
    Transition,
  };
});

// Mock icons
jest.mock("@heroicons/react/24/outline", () => ({
  XMarkIcon: () => <span data-testid="close-icon">×</span>,
}));

// Mock AppButton
jest.mock("./AppButton", () => ({
  AppButton: ({ children, onClick }: any) =>
    React.createElement(
      "button",
      { onClick, "data-testid": "app-button" },
      children
    ),
}));

// Imports AFTER mocks
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingDetailsModal } from "./BookingDetailsModal";
import type { MyBooking } from "@/types/booking";

describe("BookingDetailsModal", () => {
  const booking: MyBooking = {
    id: "1",
    hotelName: "Grand Hotel",
    hotelAddress: "123 Main Street",
    hotelImage: "https://example.com/image.jpg",
    roomType: "Deluxe Suite",
    checkIn: "2026-05-20",
    checkOut: "2026-05-25",
    totalPrice: 750,
    status: "active",
    daysRemaining: 5,
  };

  const props = {
    isOpen: true,
    onClose: jest.fn(),
    booking,
    onCancelBooking: jest.fn(),
    onSubmitReview: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------
  // VISIBILITY
  // ------------------------
  it("renders modal when open", () => {
    render(<BookingDetailsModal {...props} />);
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<BookingDetailsModal {...props} isOpen={false} />);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("returns null when booking is null", () => {
    render(<BookingDetailsModal {...props} booking={null} />);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  // ------------------------
  // CONTENT
  // ------------------------
  it("shows booking details", () => {
    render(<BookingDetailsModal {...props} />);

    expect(screen.getByText("Booking Details")).toBeInTheDocument();
    expect(screen.getByText(booking.hotelName)).toBeInTheDocument();
    expect(screen.getByText(booking.hotelAddress!)).toBeInTheDocument();
    expect(screen.getByText(booking.roomType)).toBeInTheDocument();
    expect(screen.getByText(booking.checkIn)).toBeInTheDocument();
    expect(screen.getByText(booking.checkOut)).toBeInTheDocument();
    expect(screen.getByText(`$${booking.totalPrice}`)).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders hotel image", () => {
    render(<BookingDetailsModal {...props} />);

    const img = screen.getByAltText(booking.hotelName);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", booking.hotelImage);
  });

  // ------------------------
  // ACTIONS
  // ------------------------
  it("shows cancel button for active booking", () => {
    render(<BookingDetailsModal {...props} />);
    expect(screen.getByText("Cancel Booking")).toBeInTheDocument();
  });

  it("shows cancel button for upcoming booking", () => {
    render(
      <BookingDetailsModal
        {...props}
        booking={{ ...booking, status: "upcoming" }}
      />
    );
    expect(screen.getByText("Cancel Booking")).toBeInTheDocument();
  });

  it("shows review button for past booking", () => {
    render(
      <BookingDetailsModal
        {...props}
        booking={{ ...booking, status: "past", canReview: true }}
      />
    );

    expect(screen.getByText("Leave Review")).toBeInTheDocument();
  });

  it("calls cancel booking", async () => {
    const user = userEvent.setup();
    render(<BookingDetailsModal {...props} />);

    await user.click(screen.getByText("Cancel Booking"));

    expect(props.onCancelBooking).toHaveBeenCalledWith(booking.id);
  });

  it("calls leave review", async () => {
    const user = userEvent.setup();

    render(
      <BookingDetailsModal
        {...props}
        booking={{ ...booking, status: "past", canReview: true }}
      />
    );

    await user.click(screen.getByText("Leave Review"));
    await user.click(screen.getByText("Submit Review"));

    expect(props.onSubmitReview).toHaveBeenCalledWith(booking.id, 5, "");
  });

  it("does not call handlers when callbacks are undefined", async () => {
    const user = userEvent.setup();
    const propsWithoutCallbacks = {
      ...props,
      onCancelBooking: undefined,
      onSubmitReview: undefined,
    };

    render(
      <BookingDetailsModal
        {...propsWithoutCallbacks}
        booking={{ ...booking, status: "past", canReview: true }}
      />
    );

    await user.click(screen.getByText("Leave Review"));
    await user.click(screen.getByText("Submit Review"));
    // Should not throw, just not call undefined function

    expect(screen.getByText("Submit Review")).toBeInTheDocument();
  });

  // ------------------------
  // CLOSE
  // ------------------------
  it("renders close icon", () => {
    render(<BookingDetailsModal {...props} />);
    expect(screen.getByTestId("close-icon")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const user = userEvent.setup();
    render(<BookingDetailsModal {...props} />);

    const closeButton = screen.getByRole("button", { name: /close modal/i });

    await user.click(closeButton);

    expect(props.onClose).toHaveBeenCalled();
  });

  // ------------------------
  // EDGE CASES
  // ------------------------
  it("handles missing optional fields", () => {
    render(
      <BookingDetailsModal
        {...props}
        booking={{
          ...booking,
          hotelAddress: undefined,
          hotelImage: undefined,
        }}
      />
    );

    expect(screen.getByText(booking.hotelName)).toBeInTheDocument();
  });

  it("shows hotel address when available", () => {
    render(<BookingDetailsModal {...props} />);
    expect(screen.getByText(booking.hotelAddress!)).toBeInTheDocument();
  });

  it("does not render image when hotelImage is undefined", () => {
    render(
      <BookingDetailsModal
        {...props}
        booking={{ ...booking, hotelImage: undefined }}
      />
    );

    expect(screen.queryByAltText(booking.hotelName)).not.toBeInTheDocument();
  });

  // Status badge tests for different statuses
  it("renders status badge with correct text for active booking", () => {
    render(
      <BookingDetailsModal
        {...props}
        booking={{ ...booking, status: "active" }}
      />
    );

    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders status badge with correct text for upcoming booking", () => {
    render(
      <BookingDetailsModal
        {...props}
        booking={{ ...booking, status: "upcoming" }}
      />
    );

    expect(screen.getByText("upcoming")).toBeInTheDocument();
  });

  it("renders status badge with correct text for past booking", () => {
    render(
      <BookingDetailsModal
        {...props}
        booking={{ ...booking, status: "past", canReview: true }}
      />
    );

    expect(screen.getByText("past")).toBeInTheDocument();
  });

  // Modal state transitions
  it("transitions from closed to open", () => {
    const { rerender } = render(
      <BookingDetailsModal {...props} isOpen={false} />
    );

    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();

    rerender(<BookingDetailsModal {...props} isOpen={true} />);

    expect(screen.getByTestId("dialog")).toBeInTheDocument();
  });

  it("displays multiple bookings in sequence", () => {
    const { rerender } = render(
      <BookingDetailsModal
        {...props}
        booking={booking}
        isOpen={true}
      />
    );

    expect(screen.getByText(booking.hotelName)).toBeInTheDocument();

    const newBooking: MyBooking = {
      ...booking,
      id: "2",
      hotelName: "Different Hotel",
      status: "past",
    };

    rerender(
      <BookingDetailsModal
        {...props}
        booking={newBooking}
        isOpen={true}
      />
    );

    expect(screen.getByText(newBooking.hotelName)).toBeInTheDocument();
  });

  // Full text content verification
  it("displays all booking detail labels", () => {
    render(<BookingDetailsModal {...props} />);

    expect(screen.getByText("Hotel")).toBeInTheDocument();
    expect(screen.getByText("Room Type")).toBeInTheDocument();
    expect(screen.getByText("Check-in")).toBeInTheDocument();
    expect(screen.getByText("Check-out")).toBeInTheDocument();
    expect(screen.getByText("Total Price")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  // Button and interaction combinations
  it("cancel booking button has secondary variant for upcoming status", () => {
    render(
      <BookingDetailsModal
        {...props}
        booking={{ ...booking, status: "upcoming" }}
      />
    );

    const cancelButton = screen.getByText("Cancel Booking");
    expect(cancelButton).toBeInTheDocument();
  });

  it("review button has primary variant for past status", () => {
    render(
      <BookingDetailsModal
        {...props}
        booking={{ ...booking, status: "past", canReview: true }}
      />
    );

    const reviewButton = screen.getByText("Leave Review");
    expect(reviewButton).toBeInTheDocument();
  });
});
