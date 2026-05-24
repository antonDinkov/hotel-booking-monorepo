/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import { SearchEngineWrapper } from "./SearchEngineWrapper";

jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: jest.fn(),
        refresh: jest.fn(),
    }),
}));

const searchFields = [
    { label: "Destination", placeholder: "Where", icon: "pin" },
    { label: "Check In", placeholder: "N/A", icon: "calendar" },
    { label: "Guests", placeholder: "Guests", icon: "guests" },
];

const featuredListings: any[] = [];

function makeListing(i: number) {
    return {
        id: String(i),
        name: `Hotel ${i}`,
        category: "Hotel",
        rating: 4.0,
        reviewLabel: "Nice",
        image: { src: `https://example.com/${i}.jpg`, alt: `img ${i}` },
    };
}

function makeSearchPayload(listings: any[], page = 1, pageSize = 9, totalItems = listings.length) {
    return {
        data: {
            listings,
            pagination: {
                page,
                pageSize,
                totalItems,
                totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
            },
        },
    };
}

afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
});

describe("SearchEngineWrapper behaviour", () => {
    it("debounces fetch calls - not called before 300ms, called after", async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => makeSearchPayload([]) });

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
            resolveFetch({ ok: true, json: async () => makeSearchPayload([]) });
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

        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        // should show error UI
        expect(await screen.findByText(/Search Error/i)).toBeInTheDocument();
        expect(await screen.findByText(/Search failed with status 500/i)).toBeInTheDocument();
        consoleSpy.mockRestore();
    });

    it("displays Search Error when fetch throws an exception", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));

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

        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        await act(async () => {
            jest.advanceTimersByTime(300);
            jest.runAllTimers();
        });

        expect(await screen.findByText(/Search Error/i)).toBeInTheDocument();
        expect(await screen.findByText(/Network failure/i)).toBeInTheDocument();

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

        global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => makeSearchPayload(listings) });

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

    it("shows 9 results per page and navigates pages, scrolling into view on page change", async () => {
        const total = 20;
        const listings = Array.from({ length: total }, (_, i) => makeListing(i + 1));
        const pageOneListings = listings.slice(0, 9);
        const pageTwoListings = listings.slice(9, 18);

        global.fetch = jest
            .fn()
            .mockResolvedValueOnce({ ok: true, json: async () => makeSearchPayload(pageOneListings, 1, 9, total) })
            .mockResolvedValueOnce({ ok: true, json: async () => makeSearchPayload(pageTwoListings, 2, 9, total) });

        const scrollSpy = jest.fn();
        Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
            configurable: true,
            value: scrollSpy,
        });

        render(
            <SearchEngineWrapper searchFields={searchFields as any} ctaLabel="Search" featuredListings={[]} />
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

        // wait for results to render
        await waitFor(() => expect(screen.getByText(/Found/)).toBeInTheDocument());

        // initial page should show 9 results (itemsPerPage = 9)
        for (let i = 1; i <= 9; i++) {
            expect(screen.getByText(`Hotel ${i}`)).toBeInTheDocument();
        }
        // 10th should not be visible
        expect(screen.queryByText("Hotel 10")).not.toBeInTheDocument();

        // click Next
        fireEvent.click(screen.getByText(/Next/i));

        // scrollIntoView should be called
        expect(scrollSpy).toHaveBeenCalled();

        // now page 2 should show Hotel 10
        await waitFor(() => expect(screen.getByText("Hotel 10")).toBeInTheDocument());

        // number of pages should be ceil(20/9) = 3
        expect(screen.getByText("3")).toBeInTheDocument();

        // cleanup
        // @ts-ignore
        delete window.HTMLElement.prototype.scrollIntoView;
    });

    it("clears previous debounce timer when search is triggered again before timeout fires", async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => makeSearchPayload([]) });

        render(
            <SearchEngineWrapper
                searchFields={searchFields as any}
                ctaLabel="Search"
                featuredListings={featuredListings as any}
            />
        );

        jest.useFakeTimers();
        const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

        // First search
        fireEvent.change(screen.getByPlaceholderText("Where"), { target: { value: "Paris" } });
        fireEvent.change(screen.getByPlaceholderText("Start date"), { target: { value: "2026-06-01" } });
        fireEvent.change(screen.getByPlaceholderText("End date"), { target: { value: "2026-06-05" } });
        fireEvent.change(screen.getByPlaceholderText("Guests"), { target: { value: "2" } });
        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        // Before 300ms completes, trigger search again
        fireEvent.change(screen.getByPlaceholderText("Where"), { target: { value: "Berlin" } });

        await act(async () => {
            jest.advanceTimersByTime(100);
        });

        fireEvent.click(screen.getByRole("button", { name: "Search" }));

        // clearTimeout should have been called to cancel the first debounce timer
        expect(clearTimeoutSpy).toHaveBeenCalled();

        clearTimeoutSpy.mockRestore();
    });

    it("uses window.scrollTo when element scrollIntoView is unavailable", async () => {
        const total = 20;
        const listings = Array.from({ length: total }, (_, i) => makeListing(i + 1));
        const pageOneListings = listings.slice(0, 9);
        const pageTwoListings = listings.slice(9, 18);

        global.fetch = jest
            .fn()
            .mockResolvedValueOnce({ ok: true, json: async () => makeSearchPayload(pageOneListings, 1, 9, total) })
            .mockResolvedValueOnce({ ok: true, json: async () => makeSearchPayload(pageTwoListings, 2, 9, total) });

        const windowScrollSpy = jest.fn();
        Object.defineProperty(window, "scrollTo", {
            configurable: true,
            value: windowScrollSpy,
        });

        Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
            configurable: true,
            value: undefined,
        });

        render(
            <SearchEngineWrapper searchFields={searchFields as any} ctaLabel="Search" featuredListings={[]} />
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

        await waitFor(() => expect(screen.getByText(/Found/)).toBeInTheDocument());

        fireEvent.click(screen.getByText(/Next/i));

        expect(windowScrollSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

        // cleanup
        // @ts-ignore
        delete window.HTMLElement.prototype.scrollIntoView;
        // @ts-ignore
        delete window.scrollTo;
    });
});

