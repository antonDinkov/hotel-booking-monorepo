/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import { SearchEngineWrapper } from "./SearchEngineWrapper";

const searchFields = [
  { label: "Destination", placeholder: "Where", icon: "pin" },
  { label: "Check In", placeholder: "N/A", icon: "calendar" },
  { label: "Guests", placeholder: "Guests", icon: "guests" },
];

const featuredListings: any[] = [];

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe("SearchEngineWrapper behaviour", () => {
  it("debounces fetch calls - not called before 300ms, called after", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    render(
      <SearchEngineWrapper
        searchFields={searchFields as any}
        ctaLabel="Search"
        featuredListings={featuredListings as any}
      />
    );

    // populate fields
    fireEvent.change(screen.getByPlaceholderText("Where"), { target: { value: "Paris" } });
    fireEvent.change(screen.getByPlaceholderText("Start date"), { target: { value: "2026-06-01" } });
    fireEvent.change(screen.getByPlaceholderText("End date"), { target: { value: "2026-06-05" } });
    fireEvent.change(screen.getByPlaceholderText("Guests"), { target: { value: "2" } });

    jest.useFakeTimers();

    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    // fetch should NOT have been called immediately
    expect(global.fetch).not.toHaveBeenCalled();

    // advance exactly 300ms to trigger debounce
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it("shows loading state while search pending and then shows empty state when no results", async () => {
    let resolveFetch: any;
    const fetchPromise = new Promise((res) => {
      resolveFetch = res;
    });

    global.fetch = jest.fn(() => fetchPromise as Promise<any>);

    render(
      <SearchEngineWrapper
        searchFields={searchFields as any}
        ctaLabel="Search"
        featuredListings={featuredListings as any}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Where"), { target: { value: "Paris" } });
    fireEvent.change(screen.getByPlaceholderText("Start date"), { target: { value: "2026-06-01" } });
    fireEvent.change(screen.getByPlaceholderText("End date"), { target: { value: "2026-06-05" } });
    fireEvent.change(screen.getByPlaceholderText("Guests"), { target: { value: "2" } });

    jest.useFakeTimers();

    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    // while fetch is unresolved, loading UI should be visible
    await waitFor(() => expect(screen.getByText(/Loading results.../i)).toBeInTheDocument());

    // resolve fetch with empty results
    await act(async () => {
      resolveFetch({ ok: true, json: async () => [] });
    });

    // expect empty state text
    expect(await screen.findByText(/No properties found/i)).toBeInTheDocument();
  });

  it("displays Search Error when API returns non-ok response", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    render(
      <SearchEngineWrapper
        searchFields={searchFields as any}
        ctaLabel="Search"
        featuredListings={featuredListings as any}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Where"), { target: { value: "Berlin" } });
    fireEvent.change(screen.getByPlaceholderText("Start date"), { target: { value: "2026-06-01" } });
    fireEvent.change(screen.getByPlaceholderText("End date"), { target: { value: "2026-06-05" } });
    fireEvent.change(screen.getByPlaceholderText("Guests"), { target: { value: "2" } });

    jest.useFakeTimers();

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    // should show error UI
    expect(await screen.findByText(/Search Error/i)).toBeInTheDocument();
    expect(await screen.findByText(/Search failed with status 500/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it("does not call fetch when required fields are missing (early return)", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <SearchEngineWrapper
        searchFields={searchFields as any}
        ctaLabel="Search"
        featuredListings={featuredListings as any}
      />
    );

    // intentionally do NOT fill any fields and submit
    jest.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    // performSearch should early-return and not call fetch
    expect(fetchMock).not.toHaveBeenCalled();
    // and no results section should be rendered
    expect(screen.queryByText(/Search results for/)).not.toBeInTheDocument();
  });

  it("renders ListingCard(s) when API returns results", async () => {
    const listings = [
      {
        id: "1",
        name: "Test Hotel",
        category: "Hotel",
        rating: 4.5,
        reviewLabel: "Great",
        image: { src: "https://example.com/1.jpg", alt: "t" },
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => listings });

    render(
      <SearchEngineWrapper
        searchFields={searchFields as any}
        ctaLabel="Search"
        featuredListings={featuredListings as any}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Where"), { target: { value: "Lisbon" } });
    fireEvent.change(screen.getByPlaceholderText("Start date"), { target: { value: "2026-06-01" } });
    fireEvent.change(screen.getByPlaceholderText("End date"), { target: { value: "2026-06-05" } });
    fireEvent.change(screen.getByPlaceholderText("Guests"), { target: { value: "2" } });

    jest.useFakeTimers();

    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    // listing should be rendered
    expect(await screen.findByText("Test Hotel")).toBeInTheDocument();
    // header should display found count when not loading
    expect(await screen.findByText(/Found 1 properties/i)).toBeInTheDocument();
  });
});
 
