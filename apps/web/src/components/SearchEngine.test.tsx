/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchEngine } from "./SearchEngine";
import type { SearchField } from "../types/hotel-panel";

const searchFields: SearchField[] = [
  { label: "Destination", placeholder: "Where to?", icon: "pin" },
  { label: "Check In", placeholder: "Start date", icon: "calendar" },
  { label: "Guests", placeholder: "Guests", icon: "guests" },
];

describe("SearchEngine", () => {
  it("calls onSearch with entered values", () => {
    const onSearch = jest.fn();

    render(
      <SearchEngine
        searchFields={searchFields}
        ctaLabel="Search"
        onSearch={onSearch}
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

    expect(onSearch).toHaveBeenCalledWith({
      destination: "Miami",
      checkInDate: "2026-06-01",
      checkOutDate: "2026-06-05",
      guests: "2",
    });
  });
});
