/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { ListingDetailsCard } from "./ListingDetailsCard";
import type { ListingDetails } from "../types/hotel-panel";

const backMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ back: backMock }),
}));

const listing: ListingDetails = {
  id: "l1",
  name: "Ocean View Retreat",
  category: "Resort",
  rating: 4.8,
  reviewLabel: "320 reviews",
  image: { src: "/images/ocean.jpg", alt: "Ocean view" },
  description: "A peaceful retreat by the sea.",
  price: 240,
  pricePerNight: "$240/night",
  location: "Miami Beach, FL",
  bedrooms: 2,
  bathrooms: 2,
  guests: 4,
  amenities: [
    { icon: "wave", name: "Oceanfront" },
    { icon: "wifi", name: "Wi-Fi" },
  ],
  images: [
    { src: "/images/ocean-1.jpg", alt: "Ocean room" },
    { src: "/images/ocean-2.jpg", alt: "Balcony" },
  ],
  highlights: ["Private balcony", "Beach access"],
};

describe("ListingDetailsCard", () => {
  afterEach(() => {
    backMock.mockClear();
  });

  it("renders primary listing details", () => {
    render(<ListingDetailsCard listing={listing} />);

    expect(screen.getByText("Ocean View Retreat")).toBeInTheDocument();
    expect(screen.getByText("$240")).toBeInTheDocument();
  });

  it("navigates back when the back button is clicked", () => {
    render(<ListingDetailsCard listing={listing} />);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(backMock).toHaveBeenCalledTimes(1);
  });
});
