/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeaturedListings } from "./FeaturedListings";

function makeListing(i: number) {
  return {
    id: String(i),
    name: `Hotel ${i}`,
    category: "Hotel",
    rating: 4.2,
    reviewLabel: "Nice",
    image: { src: `https://example.com/${i}.jpg`, alt: `img ${i}` },
  };
}

describe("FeaturedListings", () => {
  it("shows empty state when no listings", () => {
    render(<FeaturedListings listings={[]} itemsPerPage={6} />);
    expect(screen.getByText(/No featured properties/i)).toBeInTheDocument();
  });

  it("renders all listings when count <= itemsPerPage and no pagination", () => {
    const listings = Array.from({ length: 5 }, (_, i) => makeListing(i + 1));
    render(<FeaturedListings listings={listings} itemsPerPage={6} />);

    listings.forEach((l) => expect(screen.getByText(l.name)).toBeInTheDocument());
    expect(screen.queryByLabelText(/Pagination/i)).not.toBeInTheDocument();
  });

  it("paginates listings when more than itemsPerPage and navigates pages", () => {
    const listings = Array.from({ length: 7 }, (_, i) => makeListing(i + 1));
    render(<FeaturedListings listings={listings} itemsPerPage={6} />);

    // First page shows first 6 hotels
    for (let i = 1; i <= 6; i++) {
      expect(screen.getByText(`Hotel ${i}`)).toBeInTheDocument();
    }
    // 7th should not be visible initially
    expect(screen.queryByText("Hotel 7")).not.toBeInTheDocument();

    // Click Next
    const next = screen.getByText(/Next/i);
    fireEvent.click(next);

    // Now Hotel 7 should appear
    expect(screen.getByText("Hotel 7")).toBeInTheDocument();
  });
});
