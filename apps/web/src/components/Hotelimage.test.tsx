/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import HotelImage from "./Hotelimage";

describe("HotelImage", () => {
  it("renders fallback when no images provided", () => {
    render(<HotelImage />);

    const fallback = document.querySelector("div.bg-slate-100");
    expect(fallback).toBeInTheDocument();
  });

  it("renders image element when src provided", () => {
    render(<HotelImage images={["https://example.com/test.jpg"]} alt="hotel" />);

    const img = screen.getByAltText("hotel");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/test.jpg");
  });
});
