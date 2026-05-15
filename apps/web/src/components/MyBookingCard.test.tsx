import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyBookingCard } from "./MyBookingCard";
import type { BookingDisplayStatus } from "@/types/booking";

describe("MyBookingCard", () => {
  const defaultProps = {
    hotelName: "Grand Hotel",
    roomType: "Deluxe",
    checkIn: "2026-05-20",
    checkOut: "2026-05-25",
    totalPrice: 750,
    status: "active" as BookingDisplayStatus,
    daysRemaining: 6,
    onCardClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render hotel name", () => {
      render(<MyBookingCard {...defaultProps} />);
      expect(screen.getByText("Grand Hotel")).toBeInTheDocument();
    });

    it("should render room type", () => {
      render(<MyBookingCard {...defaultProps} />);
      expect(screen.getByText("Deluxe")).toBeInTheDocument();
    });

    it("should render check-in and check-out dates", () => {
      render(<MyBookingCard {...defaultProps} />);
      expect(screen.getByText(/2026-05-20/)).toBeInTheDocument();
      expect(screen.getByText(/2026-05-25/)).toBeInTheDocument();
    });

    it("should render total price", () => {
      render(<MyBookingCard {...defaultProps} />);
      expect(screen.getByText("$750")).toBeInTheDocument();
    });

    it("should render article element", () => {
      const { container } = render(<MyBookingCard {...defaultProps} />);
      expect(container.querySelector("article")).toBeInTheDocument();
    });
  });

  describe("status styling", () => {
    it("should display 'Active' badge for active status", () => {
      render(<MyBookingCard {...defaultProps} status="active" />);
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should display 'Upcoming' badge for upcoming status", () => {
      render(<MyBookingCard {...defaultProps} status="upcoming" />);
      expect(screen.getByText("Upcoming")).toBeInTheDocument();
    });

    it("should display 'Past' badge for past status", () => {
      render(<MyBookingCard {...defaultProps} status="past" />);
      expect(screen.getByText("Past")).toBeInTheDocument();
    });

    it("should apply correct styling for active status", () => {
      const { container } = render(<MyBookingCard {...defaultProps} status="active" />);
      const article = container.querySelector("article");
      expect(article?.className).toContain("ring-blue-100");
      expect(article?.className).toContain("bg-white");
    });

    it("should apply correct styling for upcoming status", () => {
      const { container } = render(<MyBookingCard {...defaultProps} status="upcoming" />);
      const article = container.querySelector("article");
      expect(article?.className).toContain("bg-slate-50");
    });

    it("should apply correct styling for past status", () => {
      const { container } = render(<MyBookingCard {...defaultProps} status="past" />);
      const article = container.querySelector("article");
      expect(article?.className).toContain("bg-slate-100");
    });
  });

  describe("status details section", () => {
    it("should show days remaining for active status", () => {
      render(<MyBookingCard {...defaultProps} status="active" daysRemaining={6} />);
      expect(screen.getByText("6 days until checkout")).toBeInTheDocument();
    });

    it("should show singular 'day' for 1 day remaining", () => {
      render(<MyBookingCard {...defaultProps} status="active" daysRemaining={1} />);
      expect(screen.getByText("1 day until checkout")).toBeInTheDocument();
    });

    it("should show 'Currently staying' when daysRemaining is undefined for active", () => {
      render(<MyBookingCard {...defaultProps} status="active" daysRemaining={undefined} />);
      expect(screen.getByText("Currently staying")).toBeInTheDocument();
    });

    it("should show upcoming message for upcoming status", () => {
      render(<MyBookingCard {...defaultProps} status="upcoming" />);
      expect(screen.getByText("This reservation starts soon.")).toBeInTheDocument();
    });

    it("should show past message for past status", () => {
      render(<MyBookingCard {...defaultProps} status="past" />);
      expect(screen.getByText("This stay has completed.")).toBeInTheDocument();
    });

    it("should not show daysRemaining for past status", () => {
      render(<MyBookingCard {...defaultProps} status="past" daysRemaining={10} />);
      expect(screen.queryByText("10 days until checkout")).not.toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onCardClick when card is clicked", async () => {
      const user = userEvent.setup();
      const onCardClick = jest.fn();

      render(<MyBookingCard {...defaultProps} onCardClick={onCardClick} />);

      const article = screen.getByRole("article");
      await user.click(article);

      expect(onCardClick).toHaveBeenCalledTimes(1);
    });

    it("should handle missing onCardClick callback", async () => {
      const user = userEvent.setup();
      render(<MyBookingCard {...defaultProps} onCardClick={undefined} />);

      const article = screen.getByRole("article");
      await user.click(article);

      // Should not throw error
      expect(article).toBeInTheDocument();
    });

    it("should have cursor-pointer class for interactivity", () => {
      const { container } = render(<MyBookingCard {...defaultProps} />);
      const article = container.querySelector("article");
      expect(article?.className).toContain("cursor-pointer");
    });

    it("should apply hover shadow effect", () => {
      const { container } = render(<MyBookingCard {...defaultProps} />);
      const article = container.querySelector("article");
      expect(article?.className).toContain("hover:shadow-lg");
    });
  });

  describe("edge cases", () => {
    it("should handle very long hotel names", () => {
      const longName = "A".repeat(100);
      render(<MyBookingCard {...defaultProps} hotelName={longName} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it("should handle very high prices", () => {
      render(<MyBookingCard {...defaultProps} totalPrice={99999} />);
      expect(screen.getByText("$99999")).toBeInTheDocument();
    });

    it("should handle zero price", () => {
      render(<MyBookingCard {...defaultProps} totalPrice={0} />);
      expect(screen.getByText("$0")).toBeInTheDocument();
    });

    it("should handle 0 days remaining", () => {
      render(<MyBookingCard {...defaultProps} status="active" daysRemaining={0} />);
      expect(screen.getByText("0 days until checkout")).toBeInTheDocument();
    });

    it("should handle different room types", () => {
      const roomTypes = ["Single", "Standard", "Deluxe", "Suite", "Presidential"];

      roomTypes.forEach((roomType) => {
        const { unmount } = render(<MyBookingCard {...defaultProps} roomType={roomType} />);
        expect(screen.getByText(roomType)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("accessibility", () => {
    it("should use semantic article element", () => {
      const { container } = render(<MyBookingCard {...defaultProps} />);
      expect(container.querySelector("article")).toBeInTheDocument();
    });

    it("should have proper heading hierarchy", () => {
      render(<MyBookingCard {...defaultProps} />);
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeInTheDocument();
    });

    it("should include status details for screen readers", () => {
      render(<MyBookingCard {...defaultProps} status="active" daysRemaining={5} />);
      // Status details section should be available in the document
      expect(screen.getByText("Status details")).toBeInTheDocument();
    });
  });

  describe("conditional rendering", () => {
    it("should render dates box", () => {
      render(<MyBookingCard {...defaultProps} />);
      expect(screen.getByText("Dates")).toBeInTheDocument();
    });

    it("should render status details box", () => {
      render(<MyBookingCard {...defaultProps} />);
      expect(screen.getByText("Status details")).toBeInTheDocument();
    });

    it("should always show all main sections", () => {
      render(<MyBookingCard {...defaultProps} status="past" />);
      expect(screen.getByText(defaultProps.hotelName)).toBeInTheDocument();
      expect(screen.getByText(defaultProps.roomType)).toBeInTheDocument();
      expect(screen.getByText("Dates")).toBeInTheDocument();
      expect(screen.getByText("Status details")).toBeInTheDocument();
    });
  });
});
