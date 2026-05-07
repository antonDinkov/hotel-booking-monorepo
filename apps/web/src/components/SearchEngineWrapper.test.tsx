/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { SearchEngineWrapper } from "./SearchEngineWrapper";
import type { SearchField, Listing } from "../types/hotel-panel";

const searchFields: SearchField[] = [
  { label: "Destination", placeholder: "Where to?", icon: "pin" },
  { label: "Check In", placeholder: "Start date", icon: "calendar" },
  { label: "Guests", placeholder: "Guests", icon: "guests" },
];

const sampleListings: Listing[] = [
  {
    id: "l1",
    name: "Ocean View Retreat",
    category: "Resort",
    rating: 4.8,
    reviewLabel: "320 reviews",
    image: { src: "/images/ocean.jpg", alt: "Ocean view" },
  },
  {
    id: "l2",
    name: "City Lights Loft",
    category: "Apartment",
    rating: 4.4,
    reviewLabel: "210 reviews",
    image: { src: "/images/city.jpg", alt: "City loft" },
  },
];

describe("SearchEngineWrapper", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("fetches and renders search results", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleListings,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <SearchEngineWrapper
        searchFields={searchFields}
        ctaLabel="Search"
        featuredListings={[]}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Where to?"), {
      target: { value: "Miami" },
    });
    fireEvent.change(screen.getByPlaceholderText("Start date"), {
      target: { value: "2026-06-01" },
    });
    fireEvent.change(screen.getByPlaceholderText("End date"), {
      target: { value: "2026-06-05" },
    });
    fireEvent.change(screen.getByPlaceholderText("Guests"), {
      target: { value: "2" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/search?destination=Miami&checkInDate=2026-06-01&checkOutDate=2026-06-05&guests=2"
    );
    expect(
      await screen.findByText('Search results for "Miami"')
    ).toBeInTheDocument();
    expect(await screen.findByText("Ocean View Retreat")).toBeInTheDocument();
  });

  it("shows error message when search fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <SearchEngineWrapper
        searchFields={searchFields}
        ctaLabel="Search"
        featuredListings={[]}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Where to?"), {
      target: { value: "Miami" },
    });
    fireEvent.change(screen.getByPlaceholderText("Start date"), {
      target: { value: "2026-06-01" },
    });
    fireEvent.change(screen.getByPlaceholderText("End date"), {
      target: { value: "2026-06-05" },
    });
    fireEvent.change(screen.getByPlaceholderText("Guests"), {
      target: { value: "2" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText("Search Error")).toBeInTheDocument();
    expect(
      screen.getByText("Search failed with status 500")
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
