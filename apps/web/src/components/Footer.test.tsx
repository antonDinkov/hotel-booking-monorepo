/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders the footer with copyright and navigation", () => {
    render(<Footer />);

    expect(screen.getByText(/© \d{4} BookYourStay\. All rights reserved\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  });

  it("displays the current year in copyright", () => {
    const currentYear = new Date().getFullYear();
    render(<Footer />);

    expect(screen.getByText(`© ${currentYear} BookYourStay. All rights reserved.`)).toBeInTheDocument();
  });
});