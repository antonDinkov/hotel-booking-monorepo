import React from "react";
import { render } from "@testing-library/react";
import type { HotelPanelData } from "@/types/hotel-panel";

const mockAuthorize = jest.fn();
const mockGetHotelPanelData = jest.fn();
const mockGetBookings = jest.fn();
const mockGetMyReviewsCount = jest.fn();
const mockGetSavedHotelsCount = jest.fn();
const mockGetFavoriteHotelIds = jest.fn();
const mockRedirect = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

jest.mock("@/components/SearchEngineWrapper", () => ({
  SearchEngineWrapper: ({ ctaLabel }: { ctaLabel: string }) => (
    <div data-testid="search-engine-wrapper">
      SearchEngineWrapper - CTA: {ctaLabel}
    </div>
  ),
}));

jest.mock("@/components/FeaturedListings", () => ({
  FeaturedListings: ({ itemsPerPage }: { itemsPerPage: number }) => (
    <div data-testid="featured-listings">
      FeaturedListings - {itemsPerPage} per page
    </div>
  ),
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authorize: (...args: unknown[]) => mockAuthorize(...args),
}));

jest.mock("@/server/services/hotelPanel", () => ({
  getHotelPanelData: (...args: unknown[]) => mockGetHotelPanelData(...args),
}));

jest.mock("@/server/services/bookings", () => ({
  getBookings: (...args: unknown[]) => mockGetBookings(...args),
}));

jest.mock("@/server/services/reviews", () => ({
  getMyReviewsCount: (...args: unknown[]) => mockGetMyReviewsCount(...args),
}));

jest.mock("@/server/services/favorites", () => ({
  getSavedHotelsCount: (...args: unknown[]) => mockGetSavedHotelsCount(...args),
  getFavoriteHotelIds: (...args: unknown[]) => mockGetFavoriteHotelIds(...args),
}));

import DashboardPage from "./page";

function createPanelData(overrides: Partial<HotelPanelData> = {}): HotelPanelData {
  return {
    brand: { name: "BookYourStay" },
    navigation: {
      primaryAction: "Sign In",
      secondaryAction: "For Hosts",
    },
    hero: {
      eyebrow: "Travel smarter",
      title: "Find Your Perfect Stay",
      description: "Browse featured hotels.",
      image: {
        src: "https://example.com/hero.jpg",
        alt: "Hotel hero",
      },
    },
    search: {
      cta: "Search Hotels",
    },
    searchFields: [
      { label: "Destination", placeholder: "Where to?", icon: "pin" },
      { label: "Check In - Check Out", placeholder: "Pick dates", icon: "calendar" },
      { label: "Guests", placeholder: "2 adults", icon: "guests" },
    ],
    featuredListings: [
      {
        id: "1",
        name: "Luxury Hotel",
        category: "New York",
        image: { src: "image1.jpg", alt: "Luxury Hotel cover image" },
        rating: 4.8,
        ratingLabel: "4.8",
        reviewLabel: "Verified stays",
        trustBadge: null,
      },
    ],
    featuredHeading: {
      title: "Featured Hotels",
      subtitle: "Discover our top-rated properties",
    },
    ...overrides,
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorize.mockResolvedValue({ ok: true, userId: "user-1", roles: ["client"] });
    mockGetHotelPanelData.mockResolvedValue(createPanelData());
    mockGetBookings.mockResolvedValue([]);
    mockGetMyReviewsCount.mockResolvedValue(0);
    mockGetSavedHotelsCount.mockResolvedValue(0);
    mockGetFavoriteHotelIds.mockResolvedValue([]);
  });

  it("renders dashboard with panel data when available", async () => {
    const { getByTestId, getByText } = render(await DashboardPage());

    expect(getByTestId("search-engine-wrapper")).toBeInTheDocument();
    expect(getByTestId("featured-listings")).toBeInTheDocument();
    expect(getByText("Dashboard")).toBeInTheDocument();
    expect(getByText("Track your upcoming stays, manage bookings, and review your preferences.")).toBeInTheDocument();
  });

  it("renders dashboard without search section when panelData is null", async () => {
    mockGetHotelPanelData.mockResolvedValue(null);

    const { queryByTestId, getByText } = render(await DashboardPage());

    expect(queryByTestId("search-engine-wrapper")).not.toBeInTheDocument();
    expect(queryByTestId("featured-listings")).not.toBeInTheDocument();
    expect(getByText("Dashboard")).toBeInTheDocument();
  });

  it("passes correct props to SearchEngineWrapper and FeaturedListings", async () => {
    mockGetHotelPanelData.mockResolvedValue(createPanelData({
      search: { cta: "Find Your Stay" },
      featuredHeading: {
        title: "Best Deals",
        subtitle: "Limited time offers",
      },
      featuredListings: [
        {
          id: "2",
          name: "Boutique Hotel",
          category: "Paris",
          image: { src: "image2.jpg", alt: "Boutique Hotel cover image" },
          rating: 4.5,
          reviewLabel: "18 reviews",
          trustBadge: null,
        },
      ],
    }));

    const { getByText } = render(await DashboardPage());

    expect(getByText("SearchEngineWrapper - CTA: Find Your Stay")).toBeInTheDocument();
    expect(getByText("FeaturedListings - 6 per page")).toBeInTheDocument();
    expect(getByText("Best Deals")).toBeInTheDocument();
    expect(getByText("Limited time offers")).toBeInTheDocument();
  });

  it("renders static dashboard sections regardless of panelData state", async () => {
    mockGetHotelPanelData.mockResolvedValue(null);

    const { getByText } = render(await DashboardPage());

    expect(getByText("Upcoming Trips")).toBeInTheDocument();
    expect(getByText("No upcoming stays yet.")).toBeInTheDocument();
    expect(getByText("Saved Hotels")).toBeInTheDocument();
    expect(getByText("Browse listings to save favorites.")).toBeInTheDocument();
    expect(getByText("My Reviews")).toBeInTheDocument();
    expect(getByText("Share feedback after a stay.")).toBeInTheDocument();
  });

  it("does not render featured section when panelData is null", async () => {
    mockGetHotelPanelData.mockResolvedValue(null);

    const { queryByTestId } = render(await DashboardPage());

    expect(queryByTestId("featured-listings")).not.toBeInTheDocument();
  });
});
