/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { BookingsClient } from "./BookingsClient";
import type { MyBooking } from "@/types/booking";

jest.mock("@/components/MyBookingCard", () => ({
  MyBookingCard: ({ onCardClick, hotelName }) => (
    <div data-testid="booking-card" onClick={onCardClick}>
      {hotelName}
    </div>
  ),
}));

jest.mock("@/components/BookingDetailsModal", () => ({
  BookingDetailsModal: ({ isOpen, onClose, booking, onCancelBooking, onLeaveReview }: any) => (
    isOpen ? (
      <div data-testid="booking-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onCancelBooking(booking?.id)}>Cancel</button>
        <button onClick={() => onLeaveReview(booking?.id)}>Review</button>
      </div>
    ) : null
  ),
}));

jest.mock("@/components/AppButton", () => ({
  AppButton: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

describe("BookingsClient", () => {
  const mockActiveBooking: MyBooking = {
    id: "active-1",
    hotelName: "Active Hotel",
    roomType: "Deluxe",
    checkIn: "2024-01-01",
    checkOut: "2024-01-05",
    totalPrice: 500,
    status: "active",
  };

  const mockInactiveBookings: MyBooking[] = [
    {
      id: "inactive-1",
      hotelName: "Hotel A",
      roomType: "Standard",
      checkIn: "2024-01-10",
      checkOut: "2024-01-15",
      totalPrice: 300,
      status: "upcoming",
    },
    {
      id: "inactive-2",
      hotelName: "Hotel B",
      roomType: "Suite",
      checkIn: "2024-01-20",
      checkOut: "2024-01-25",
      totalPrice: 800,
      status: "upcoming",
    },
    {
      id: "inactive-3",
      hotelName: "Hotel C",
      roomType: "Deluxe",
      checkIn: "2024-01-30",
      checkOut: "2024-02-05",
      totalPrice: 600,
      status: "upcoming",
    },
    {
      id: "inactive-4",
      hotelName: "Hotel D",
      roomType: "Standard",
      checkIn: "2024-02-10",
      checkOut: "2024-02-15",
      totalPrice: 400,
      status: "past",
    },
  ];

  it("renders active booking section when active booking exists", () => {
    render(<BookingsClient activeBooking={mockActiveBooking} inactiveBookings={[]} />);

    expect(screen.getByText("Active Booking")).toBeInTheDocument();
    expect(screen.getAllByTestId("booking-card")).toHaveLength(1);
  });

  it("does not render active booking section when no active booking", () => {
    render(<BookingsClient activeBooking={null} inactiveBookings={mockInactiveBookings} />);

    expect(screen.queryByText("Active Booking")).not.toBeInTheDocument();
    expect(screen.getByText("All Bookings")).toBeInTheDocument();
  });

  it("renders 'Other Bookings' when active booking exists", () => {
    render(<BookingsClient activeBooking={mockActiveBooking} inactiveBookings={mockInactiveBookings} />);

    expect(screen.getByText("Other Bookings")).toBeInTheDocument();
  });

  it("renders empty state when no inactive bookings", () => {
    render(<BookingsClient activeBooking={null} inactiveBookings={[]} />);

    expect(screen.getByText("No bookings yet.")).toBeInTheDocument();
  });

  it("renders empty state with different message when active booking exists", () => {
    render(<BookingsClient activeBooking={mockActiveBooking} inactiveBookings={[]} />);

    expect(screen.getByText("No other bookings yet.")).toBeInTheDocument();
  });

  it("renders all inactive bookings when less than page limit", () => {
    const fewBookings = mockInactiveBookings.slice(0, 2);
    render(<BookingsClient activeBooking={null} inactiveBookings={fewBookings} />);

    expect(screen.getAllByTestId("booking-card")).toHaveLength(2);
    expect(screen.queryByText(/Page/)).not.toBeInTheDocument();
  });

  it("paginates bookings correctly", () => {
    render(<BookingsClient activeBooking={null} inactiveBookings={mockInactiveBookings} />);

    // Should show first 3 bookings (BOOKINGS_PER_PAGE = 3)
    expect(screen.getAllByTestId("booking-card")).toHaveLength(3);
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  });

  it("handles pagination navigation", () => {
    render(<BookingsClient activeBooking={null} inactiveBookings={mockInactiveBookings} />);

    // Click next page
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();

    // Should show the 4th booking
    expect(screen.getAllByTestId("booking-card")).toHaveLength(1);
  });

  it("disables previous button on first page", () => {
    render(<BookingsClient activeBooking={null} inactiveBookings={mockInactiveBookings} />);

    const prevButton = screen.getByText("Previous");
    expect(prevButton).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(<BookingsClient activeBooking={null} inactiveBookings={mockInactiveBookings} />);

    // Go to last page
    fireEvent.click(screen.getByText("Next"));
    const nextButton = screen.getByText("Next");
    expect(nextButton).toBeDisabled();
  });

  it("opens modal when booking card is clicked", () => {
    render(<BookingsClient activeBooking={null} inactiveBookings={mockInactiveBookings} />);

    const firstCard = screen.getAllByTestId("booking-card")[0];
    fireEvent.click(firstCard);

    expect(screen.getByTestId("booking-modal")).toBeInTheDocument();
  });

  it("closes modal when close button is clicked", () => {
    render(<BookingsClient activeBooking={null} inactiveBookings={mockInactiveBookings} />);

    // Open modal
    const firstCard = screen.getAllByTestId("booking-card")[0];
    fireEvent.click(firstCard);

    // Close modal
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("booking-modal")).not.toBeInTheDocument();
  });

  it("handles cancel booking action", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    render(<BookingsClient activeBooking={null} inactiveBookings={mockInactiveBookings} />);

    // Open modal
    const firstCard = screen.getAllByTestId("booking-card")[0];
    fireEvent.click(firstCard);

    // Cancel booking
    fireEvent.click(screen.getByText("Cancel"));

    expect(consoleSpy).toHaveBeenCalledWith("Cancel booking:", "inactive-1");
    expect(screen.queryByTestId("booking-modal")).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("handles leave review action", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    render(<BookingsClient activeBooking={null} inactiveBookings={mockInactiveBookings} />);

    // Open modal
    const firstCard = screen.getAllByTestId("booking-card")[0];
    fireEvent.click(firstCard);

    // Leave review
    fireEvent.click(screen.getByText("Review"));

    expect(consoleSpy).toHaveBeenCalledWith("Leave review for:", "inactive-1");
    expect(screen.queryByTestId("booking-modal")).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});