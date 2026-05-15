import React from "react";
import { render } from "@testing-library/react";
import type { HotelPanelData } from "@/types/hotel-panel";

// Mock dependencies before importing the component
jest.mock("@/components/SearchEngineWrapper", () => ({
  SearchEngineWrapper: ({
    searchFields,
    ctaLabel,
    featuredListings,
  }: {
    searchFields: unknown;
    ctaLabel: string;
    featuredListings: unknown;
  }) => (
    <div data-testid="search-engine-wrapper">
      SearchEngineWrapper - CTA: {ctaLabel}
    </div>
  ),
}));

jest.mock("@/components/FeaturedListings", () => ({
  FeaturedListings: ({ listings, itemsPerPage }: { listings: unknown; itemsPerPage: number }) => (
    <div data-testid="featured-listings">
      FeaturedListings - {itemsPerPage} per page
    </div>
  ),
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

let mockGetServerSession: jest.Mock;
let mockGetHotelPanelData: jest.Mock;
let mockGetBookings: jest.Mock;

jest.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

jest.mock("@/server/services/hotelPanel", () => ({
  getHotelPanelData: (...args: unknown[]) => mockGetHotelPanelData(...args),
}));

jest.mock("@/server/services/bookings", () => ({
  getBookings: (...args: unknown[]) => mockGetBookings(...args),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    mockGetBookings = jest.fn().mockResolvedValue([]);
  });

  it("renders dashboard with panel data when available", async () => {
    const mockPanelData: HotelPanelData = {
      searchFields: {
        destination: ["New York", "Los Angeles"],
        checkIn: "2026-05-12",
        checkOut: "2026-05-15",
      },
      search: {
        cta: "Search Hotels",
      },
      featuredListings: [
        {
          id: "hotel-1",
          name: "Luxury Hotel",
          image: "image1.jpg",
          rating: 4.8,
          location: "New York",
          price: 250,
        },
      ],
      featuredHeading: {
        title: "Featured Hotels",
        subtitle: "Discover our top-rated properties",
      },
    };

    mockGetHotelPanelData = jest.fn().mockResolvedValue(mockPanelData);

    // Reset modules to apply the mock
    jest.resetModules();
    const { default: DashboardPage } = await import("./page");

    const { getByTestId, getByText } = render(await DashboardPage());

    // Verify child components are rendered
    expect(getByTestId("search-engine-wrapper")).toBeInTheDocument();
    expect(getByTestId("featured-listings")).toBeInTheDocument();

    // Verify static content
    expect(getByText("Dashboard")).toBeInTheDocument();
    expect(getByText("Track your upcoming stays, manage bookings, and review your preferences.")).toBeInTheDocument();
    expect(getByText("Quick actions")).toBeInTheDocument();
  });

  it("renders dashboard without search section when panelData is null", async () => {
    mockGetHotelPanelData = jest.fn().mockResolvedValue(null);

    jest.resetModules();
    const { default: DashboardPage } = await import("./page");

    const { queryByTestId, getByText } = render(await DashboardPage());

    // Search and featured sections should NOT render
    expect(queryByTestId("search-engine-wrapper")).not.toBeInTheDocument();
    expect(queryByTestId("featured-listings")).not.toBeInTheDocument();

    // Static content should still render
    expect(getByText("Dashboard")).toBeInTheDocument();
    expect(getByText("Quick actions")).toBeInTheDocument();
  });

  it("passes correct props to SearchEngineWrapper and FeaturedListings", async () => {
    const mockPanelData: HotelPanelData = {
      searchFields: {
        destination: ["Paris", "London"],
        checkIn: "2026-06-01",
        checkOut: "2026-06-05",
      },
      search: {
        cta: "Find Your Stay",
      },
      featuredListings: [
        {
          id: "hotel-2",
          name: "Boutique Hotel",
          image: "image2.jpg",
          rating: 4.5,
          location: "Paris",
          price: 180,
        },
        {
          id: "hotel-3",
          name: "Standard Hotel",
          image: "image3.jpg",
          rating: 4.0,
          location: "London",
          price: 120,
        },
      ],
      featuredHeading: {
        title: "Best Deals",
        subtitle: "Limited time offers",
      },
    };

    mockGetHotelPanelData = jest.fn().mockResolvedValue(mockPanelData);

    jest.resetModules();
    const { default: DashboardPage } = await import("./page");

    const { getByText, getByTestId } = render(await DashboardPage());

    // Verify SearchEngineWrapper receives correct CTA
    expect(getByText("SearchEngineWrapper - CTA: Find Your Stay")).toBeInTheDocument();

    // Verify FeaturedListings receives correct itemsPerPage
    expect(getByText("FeaturedListings - 6 per page")).toBeInTheDocument();

    // Verify featured heading content
    expect(getByText("Best Deals")).toBeInTheDocument();
    expect(getByText("Limited time offers")).toBeInTheDocument();
  });

  it("renders static dashboard sections regardless of panelData state", async () => {
    mockGetHotelPanelData = jest.fn().mockResolvedValue(null);

    jest.resetModules();
    const { default: DashboardPage } = await import("./page");

    const { getByText } = render(await DashboardPage());

    // Verify static sections
    expect(getByText("Upcoming Trips")).toBeInTheDocument();
    expect(getByText("No upcoming stays yet.")).toBeInTheDocument();
    expect(getByText("Saved Hotels")).toBeInTheDocument();
    expect(getByText("Browse listings to save favorites.")).toBeInTheDocument();
    expect(getByText("Reviews")).toBeInTheDocument();
    expect(getByText("Share feedback after a stay.")).toBeInTheDocument();
    expect(getByText("Review a recent booking")).toBeInTheDocument();
    expect(getByText("Update profile preferences")).toBeInTheDocument();
  });

  it("does not render featured section when panelData is null", async () => {
    mockGetHotelPanelData = jest.fn().mockResolvedValue(null);

    jest.resetModules();
    const { default: DashboardPage } = await import("./page");

    const { queryByTestId } = render(await DashboardPage());

    // Featured section should not render
    expect(queryByTestId("featured-listings")).not.toBeInTheDocument();
  });
});
