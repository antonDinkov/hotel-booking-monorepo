/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { ListingDetailsCard } from "./ListingDetailsCard";
import type { ListingDetails } from "../types/hotel-panel";
import type { RoomAvailability } from "@/types/room-availability";

const backMock = jest.fn();
const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ back: backMock, push: pushMock }),
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

const availability: RoomAvailability[] = [
  {
    roomTypeId: 1,
    name: "Standard",
    capacity: 2,
    pricePerNight: 180,
    totalRooms: 5,
    availableRooms: 2,
  },
  {
    roomTypeId: 2,
    name: "Deluxe",
    capacity: 4,
    pricePerNight: 240,
    totalRooms: 5,
    availableRooms: 3,
  },
];

describe("ListingDetailsCard", () => {
  afterEach(() => {
    backMock.mockClear();
  });

  it("renders primary listing details with dates", () => {
    render(
      <ListingDetailsCard
        listing={listing}
        availability={availability}
        guestsCount={4}
        checkInDate="2026-05-20"
        checkOutDate="2026-05-22"
      />
    );

    expect(screen.getByText("Ocean View Retreat")).toBeInTheDocument();
    expect(screen.getByText("Total Price")).toBeInTheDocument();
    expect(screen.getByText("Reserve")).toBeInTheDocument();
  });

  it("navigates back when the back button is clicked", () => {
    render(
      <ListingDetailsCard
        listing={listing}
        availability={availability}
        guestsCount={4}
        checkInDate="2026-05-20"
        checkOutDate="2026-05-22"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(backMock).toHaveBeenCalledTimes(1);
  });
});
