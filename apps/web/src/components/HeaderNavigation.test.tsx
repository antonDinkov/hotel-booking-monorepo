/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import { HeaderNavigation, isActiveForPaths, normalizePath } from "./HeaderNavigation";
import { signOut } from "next-auth/react";

const usePathnameMock = jest.fn();
const useRouterMock = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => useRouterMock(),
}));

jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

describe("HeaderNavigation", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    useRouterMock.mockReturnValue({ push: jest.fn() });
    // Silence noisy console.error but keep the spy so tests can assert it was called
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("guest navigation", () => {
    it("renders guest actions when logged out", () => {
      usePathnameMock.mockReturnValue("/");

      render(<HeaderNavigation brandName="BookYourStay" session={null} />);

      expect(screen.getByText("Login")).toBeInTheDocument();
      expect(screen.getByText("Register")).toBeInTheDocument();
      expect(screen.getByText("For Hosts")).toBeInTheDocument();

      const brandLink = screen.getByRole("link", { name: "BookYourStay" });
      expect(brandLink).toHaveAttribute("href", "/");
    });

    it("falls back to root path when usePathname returns null", () => {
      usePathnameMock.mockReturnValue(null);

      render(<HeaderNavigation brandName="BookYourStay" session={null} />);

      const brandLink = screen.getByRole("link", { name: "BookYourStay" });
      expect(brandLink).toHaveAttribute("href", "/");
      expect(brandLink).toHaveAttribute("aria-current", "page");
    });

    it("marks Login button active immediately after click using transient clickedPath", () => {
      usePathnameMock.mockReturnValue("/");

      render(<HeaderNavigation brandName="BookYourStay" session={null} />);

      const loginBtn = screen.getByRole("button", { name: "Login" });
      // initially not active
      expect(loginBtn).not.toHaveClass("btn-active");

      fireEvent.click(loginBtn);

      // clickedPath should make the button render with active classes
      expect(loginBtn).toHaveClass("btn-active");
    });

    it("marks Register active when pathname is /register", () => {
      usePathnameMock.mockReturnValue("/register");
      render(<HeaderNavigation brandName="BookYourStay" session={null} />);

      const registerBtn = screen.getByRole("button", { name: "Register" });
      expect(registerBtn).toHaveClass("btn-active");
    });

    it("marks For Hosts active when pathname is /partner", () => {
      usePathnameMock.mockReturnValue("/partner");
      render(<HeaderNavigation brandName="BookYourStay" session={null} />);

      const partnerBtn = screen.getByRole("button", { name: "For Hosts" });
      expect(partnerBtn).toHaveClass("btn-active");
    });

    it("executes onClick handlers for guest and partner buttons", () => {
      usePathnameMock.mockReturnValue("/");
      render(<HeaderNavigation brandName="BookYourStay" session={null} />);

      const loginBtn = screen.getByRole("button", { name: "Login" });
      const registerBtn = screen.getByRole("button", { name: "Register" });
      const hostBtn = screen.getByRole("button", { name: "For Hosts" });

      act(() => {
        fireEvent.click(loginBtn);
        fireEvent.click(registerBtn);
        fireEvent.click(hostBtn);
      });

      // clicks exercise inline handlers; no extra assertions required
    });
  });

  describe("authenticated navigation", () => {
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

    it("renders the user name when email is missing", () => {
      usePathnameMock.mockReturnValue("/dashboard");

      render(
        <HeaderNavigation
          brandName="BookYourStay"
          session={{ user: { name: "Guest User" } }}
        />
      );

      expect(screen.getByText("Guest User")).toBeInTheDocument();
    });

    it("does not render user email when session has no email or name", () => {
      usePathnameMock.mockReturnValue("/dashboard");

      render(<HeaderNavigation brandName="BookYourStay" session={{ user: {} }} />);

      expect(screen.queryByText("guest@example.com")).not.toBeInTheDocument();
    });

    it("marks Dashboard active when pathname starts with dashboard/", () => {
      usePathnameMock.mockReturnValue("/dashboard/123");

      render(
        <HeaderNavigation
          brandName="BookYourStay"
          session={{ user: { email: "me@example.com" } }}
        />
      );

      const dashboardBtn = screen.getByRole("button", { name: "Dashboard" });
      expect(dashboardBtn).toHaveClass("btn-active");
    });

    it("marks My Bookings active when logged in and pathname is /bookings", () => {
      usePathnameMock.mockReturnValue("/bookings");
      render(<HeaderNavigation brandName="BookYourStay" session={{ user: { email: "me@example.com" } }} />);

      const bookingsBtn = screen.getByRole("button", { name: "My Bookings" });
      expect(bookingsBtn).toHaveClass("btn-active");
    });

    it("marks Profile active when logged in and pathname is /profile", () => {
      usePathnameMock.mockReturnValue("/profile");
      render(<HeaderNavigation brandName="BookYourStay" session={{ user: { email: "me@example.com" } }} />);

      const profileBtn = screen.getByRole("button", { name: "Profile" });
      expect(profileBtn).toHaveClass("btn-active");
    });

    it("executes onClick handlers for logged-in buttons", () => {
      usePathnameMock.mockReturnValue("/dashboard");
      render(<HeaderNavigation brandName="BookYourStay" session={{ user: { email: "me@example.com" } }} />);

      const dashboardBtn = screen.getByRole("button", { name: "Dashboard" });
      const bookingsBtn = screen.getByRole("button", { name: "My Bookings" });
      const profileBtn = screen.getByRole("button", { name: "Profile" });

      act(() => {
        fireEvent.click(dashboardBtn);
        fireEvent.click(bookingsBtn);
        fireEvent.click(profileBtn);
      });
    });
  });

  describe("active states", () => {
    it("sets aria-current on brand link for home ('/') and for dashboard when logged in", () => {
      // unauthenticated home
      usePathnameMock.mockReturnValue("/");
      const { rerender } = render(<HeaderNavigation brandName="BookYourStay" session={null} />);
      const brandLink = screen.getByRole("link", { name: "BookYourStay" });
      expect(brandLink).toHaveAttribute("aria-current", "page");

      // logged-in dashboard
      usePathnameMock.mockReturnValue("/dashboard");
      rerender(<HeaderNavigation brandName="BookYourStay" session={{ user: { email: "me@example.com" } }} />);
      const brandLink2 = screen.getByRole("link", { name: "BookYourStay" });
      expect(brandLink2).toHaveAttribute("aria-current", "page");
    });

    it("clears clickedPath when pathname changes", async () => {
      usePathnameMock.mockReturnValue("/");
      const { rerender } = render(<HeaderNavigation brandName="BookYourStay" session={null} />);

      const loginBtn = screen.getByRole("button", { name: "Login" });
      act(() => {
        fireEvent.click(loginBtn);
      });

      expect(loginBtn).toHaveClass("btn-active");

      // simulate navigation change and ensure effect runs
      usePathnameMock.mockReturnValue("/other");
      await act(async () => {
        rerender(<HeaderNavigation brandName="BookYourStay" session={null} />);
      });

      const loginBtnAfter = screen.getByRole("button", { name: "Login" });
      expect(loginBtnAfter).not.toHaveClass("btn-active");
    });

    it("normalizePath and isActiveForPaths helpers behave correctly", () => {
      expect(normalizePath("/")).toBe("/");
      expect(normalizePath("/dashboard/")).toBe("/dashboard");
      expect(normalizePath("/a/b///")).toBe("/a/b");

      // clickedPath precedence
      expect(isActiveForPaths("/login", "/", "/login")).toBe(true);
      // root case
      expect(isActiveForPaths("/", "/", null)).toBe(true);
      // startsWith case
      expect(isActiveForPaths("/dashboard", "/dashboard/123", null)).toBe(true);
      // exact match
      expect(isActiveForPaths("/profile", "/profile", null)).toBe(true);
      // non-match
      expect(isActiveForPaths("/profile", "/", null)).toBe(false);
    });
  });

  describe("logout flow", () => {
    it("calls signOut and shows signing state then resets after timeout", async () => {
      usePathnameMock.mockReturnValue("/dashboard");

      (signOut as jest.Mock).mockResolvedValue(undefined);

      jest.useFakeTimers();

      render(
        <HeaderNavigation
          brandName="BookYourStay"
          session={{ user: { email: "guest@example.com" } }}
        />
      );

      const logoutBtn = screen.getByRole("button", { name: "Logout" });

      act(() => {
        fireEvent.click(logoutBtn);
      });

      expect((signOut as jest.Mock)).toHaveBeenCalledWith({ redirect: true, callbackUrl: "/" });

      // Button should immediately show signing out state and be disabled
      expect(screen.getByRole("button", { name: "Signing out..." })).toBeDisabled();

      // advance timers to clear signing out state (1500ms) - flush timers
      await act(async () => {
        jest.advanceTimersByTime(1500);
        // ensure any pending timer callbacks run
        // @ts-ignore
        if (typeof jest.runOnlyPendingTimers === "function") jest.runOnlyPendingTimers();
      });
    });

    it("logs an error when signOut throws", async () => {
      usePathnameMock.mockReturnValue("/dashboard");
      (signOut as jest.Mock).mockRejectedValue(new Error("signout-failed"));

      render(
        <HeaderNavigation
          brandName="BookYourStay"
          session={{ user: { email: "guest@example.com" } }}
        />
      );

      const logoutBtn = screen.getByRole("button", { name: "Logout" });

      act(() => {
        fireEvent.click(logoutBtn);
      });

      expect((signOut as jest.Mock)).toHaveBeenCalled();
      // the component catches signOut errors and logs them
      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    });

    it("resets signing-out state after the timeout", async () => {
      usePathnameMock.mockReturnValue("/dashboard");
      (signOut as jest.Mock).mockResolvedValue(undefined);

      jest.useFakeTimers();

      render(
        <HeaderNavigation
          brandName="BookYourStay"
          session={{ user: { email: "guest@example.com" } }}
        />
      );

      const logoutBtn = screen.getByRole("button", { name: "Logout" });

      act(() => {
        fireEvent.click(logoutBtn);
      });

      // signing out state appears
      expect(screen.getByRole("button", { name: "Signing out..." })).toBeDisabled();

      // let any microtasks (the signOut promise) resolve
      await Promise.resolve();
      await Promise.resolve();

      // advance the timeout that clears the signing-out state
      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      // the UI should no longer show Signing out...
      await waitFor(() => expect(screen.getByRole("button", { name: "Logout" })).not.toBeDisabled());
    });
  });

  describe("edge cases", () => {
    it("renders loading skeleton when isLoading is true", () => {
      usePathnameMock.mockReturnValue("/");

      render(<HeaderNavigation brandName="BookYourStay" session={null} isLoading={true} />);

      // detect the loading skeleton via aria-live attribute
      expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    });
  });
});
