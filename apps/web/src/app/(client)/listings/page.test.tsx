/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import ListingsPage from "./page";
import type { Listing } from "../../../types/hotel-panel";

const useSearchParamsMock = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParamsMock(),
}));

const sampleListings: Listing[] = [
  {
    id: "l1",
    name: "Ocean View Retreat",
    category: "Resort",
    rating: 4.8,
    reviewLabel: "320 reviews",
    image: { src: "/images/ocean.jpg", alt: "Ocean view" },
  },
];

describe("ListingsPage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("uses destination query to fetch results", async () => {
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({ destination: "New York" })
    );

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleListings,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<ListingsPage />);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/search?destination=New%20York"
      )
    );

    expect(
      await screen.findByText('Search results for "New York"')
    ).toBeInTheDocument();
  });

  it("shows an error message when fetch fails", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams());

    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<ListingsPage />);

    expect(
      await screen.findByText("Error: Failed to fetch listings")
    ).toBeInTheDocument();
  });

  it("shows generic error message when thrown error is not an Error instance", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams());

    const fetchMock = jest.fn().mockImplementation(() => {
      throw "Network error string";
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<ListingsPage />);

    expect(
      await screen.findByText("Error: An error occurred")
    ).toBeInTheDocument();
  });
});
