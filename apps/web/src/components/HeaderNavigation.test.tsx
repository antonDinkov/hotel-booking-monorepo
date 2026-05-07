/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { HeaderNavigation } from "./HeaderNavigation";

const usePathnameMock = jest.fn();
const useRouterMock = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => useRouterMock(),
}));

describe("HeaderNavigation", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({ push: jest.fn() });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders guest actions when logged out", () => {
    usePathnameMock.mockReturnValue("/");

    render(<HeaderNavigation brandName="BookYourStay" session={null} />);

    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
    expect(screen.getByText("For Hosts")).toBeInTheDocument();

    const brandLink = screen.getByRole("link", { name: "BookYourStay" });
    expect(brandLink).toHaveAttribute("href", "/");
  });

  it("renders client actions when logged in", () => {
    usePathnameMock.mockReturnValue("/dashboard");

    render(
      <HeaderNavigation
        brandName="BookYourStay"
        session={{ user: { email: "guest@example.com" } }}
      />
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("My Bookings")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
    expect(screen.getByText("guest@example.com")).toBeInTheDocument();

    const brandLink = screen.getByRole("link", { name: "BookYourStay" });
    expect(brandLink).toHaveAttribute("href", "/dashboard");
  });
});
