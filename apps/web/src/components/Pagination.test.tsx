/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "./Pagination";

describe("Pagination component", () => {
  it("renders nothing when totalPages <= 1", () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={1} totalPages={1} onPageChange={onPageChange} />);

    expect(screen.queryByLabelText(/Pagination/i)).not.toBeInTheDocument();
  });

  it("renders page buttons and Prev/Next and calls onPageChange correctly", () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={2} totalPages={3} onPageChange={onPageChange} />);

    // Prev and Next buttons
    const prev = screen.getByText(/Prev/i);
    const next = screen.getByText(/Next/i);
    expect(prev).toBeInTheDocument();
    expect(next).toBeInTheDocument();

    // Page buttons
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Click prev -> page 1
    fireEvent.click(prev);
    expect(onPageChange).toHaveBeenLastCalledWith(1);

    // Click next -> page 3
    fireEvent.click(next);
    expect(onPageChange).toHaveBeenLastCalledWith(3);

    // Click specific page
    fireEvent.click(screen.getByText("1"));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it("disables Prev on first page and Next on last page", () => {
    const onPageChange = jest.fn();
    const { rerender } = render(<Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />);

    const prev = screen.getByText(/Prev/i);
    expect(prev).toBeDisabled();

    rerender(<Pagination currentPage={3} totalPages={3} onPageChange={onPageChange} />);
    const next = screen.getByText(/Next/i);
    expect(next).toBeDisabled();
  });
});
