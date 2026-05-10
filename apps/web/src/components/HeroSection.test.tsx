/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { HeroSection } from "./HeroSection";
import type { Hero } from "../types/hotel-panel";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill, priority, ...props }: any) => <img {...props} />,
}));

describe("HeroSection", () => {
  const mockHero: Hero = {
    eyebrow: "Welcome",
    title: "Find Your Perfect Stay",
    description: "Discover amazing places to stay around the world",
    image: {
      src: "/hero-image.jpg",
      alt: "Hero image",
    },
  };

  it("renders the hero section with provided data", () => {
    render(<HeroSection hero={mockHero} />);

    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Find Your Perfect Stay")).toBeInTheDocument();
    expect(screen.getByText("Discover amazing places to stay around the world")).toBeInTheDocument();
  });

  it("renders the image with correct props", () => {
    render(<HeroSection hero={mockHero} />);

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", "/hero-image.jpg");
    expect(image).toHaveAttribute("alt", "Hero image");
  });

  it("uses default id when not provided", () => {
    render(<HeroSection hero={mockHero} />);

    expect(screen.getByRole("img").closest("section")).toHaveAttribute("id", "top");
  });

  it("uses provided id", () => {
    render(<HeroSection hero={mockHero} id="custom-id" />);

    expect(screen.getByRole("img").closest("section")).toHaveAttribute("id", "custom-id");
  });

  it("renders children when provided", () => {
    const childText = "Child component";
    render(
      <HeroSection hero={mockHero}>
        <div>{childText}</div>
      </HeroSection>
    );

    expect(screen.getByText(childText)).toBeInTheDocument();
  });
});