// CRITICAL: Mock modules BEFORE any imports to prevent db/index.ts initialization
jest.resetModules();

jest.mock("@/db", () => ({
    db: {
        select: jest.fn(),
        insert: jest.fn(),
    },
}));

// Mock next-auth completely to avoid ES module issues
jest.mock("next-auth", () => ({
  default: jest.fn(() => jest.fn()),
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/server/services/bookings", () => ({
  getClientBookingsPage: jest.fn(),
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {
    providers: [],
    callbacks: {},
    pages: {},
  },
}));

/* const mockBookingsClient = jest.fn(() => null);

jest.mock("./BookingsClient", () => ({
  BookingsClient: (props: any) => mockBookingsClient(props),
})); */

const mockBookingsClient = jest.fn((props: any) => {
  void props;
  return null;
});

jest.mock("./BookingsClient", () => ({
  BookingsClient: (props: any) => mockBookingsClient(props),
}));

import BookingsPage from "./page";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { getClientBookingsPage } from "@/server/services/bookings";
import type { MyBooking } from "@/types/booking";
import { render } from "@testing-library/react";

const mockGetServerSession = getServerSession as jest.Mock;
/* const mockRedirect = redirect as jest.Mock; */
const mockedRedirect = jest.mocked(redirect);
const mockGetClientBookingsPage = getClientBookingsPage as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedRedirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
  /* mockRedirect.mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  }); */
});

// Test the business logic by testing the filtering behavior
describe("BookingsPage business logic", () => {
  const mockBookings: MyBooking[] = [
    {
      id: "1",
      hotelName: "Hotel A",
      roomType: "Deluxe",
      checkIn: "2024-01-01",
      checkOut: "2024-01-05",
      totalPrice: 500,
      status: "active",
    },
    {
      id: "2",
      hotelName: "Hotel B",
      roomType: "Standard",
      checkIn: "2024-01-10",
      checkOut: "2024-01-15",
      totalPrice: 300,
      status: "upcoming",
    },
    {
      id: "3",
      hotelName: "Hotel C",
      roomType: "Suite",
      checkIn: "2023-12-01",
      checkOut: "2023-12-05",
      totalPrice: 800,
      status: "past",
    },
  ];

  const createBookingsPageResult = (bookings: MyBooking[]) => {
    const activeBooking = bookings.find((booking) => booking.status === "active") ?? null;
    const inactiveBookings = bookings.filter((booking) => booking.status !== "active");

    return {
      activeBooking,
      inactiveBookings,
      pagination: {
        page: 1,
        pageSize: 3,
        totalItems: inactiveBookings.length,
        totalPages: 1,
      },
    };
  };

  it("should redirect to login when user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(BookingsPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockedRedirect).toHaveBeenCalledWith("/login");
    expect(mockGetClientBookingsPage).not.toHaveBeenCalled();
  });

  it("should redirect to login when session has no user id", async () => {
    mockGetServerSession.mockResolvedValue({ user: {} });

    await expect(BookingsPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockedRedirect).toHaveBeenCalledWith("/login");
  });

  it("should fetch bookings for authenticated user", async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        id: "user123",
      },
    });
    mockGetClientBookingsPage.mockResolvedValue(createBookingsPageResult(mockBookings));

    const Page = await BookingsPage();
    render(Page);

    expect(mockGetClientBookingsPage).toHaveBeenCalledWith("user123", { page: 1 });
  });

  it("should correctly filter active and inactive bookings", async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        id: "user123",
      },
    });
    mockGetClientBookingsPage.mockResolvedValue(createBookingsPageResult(mockBookings));

    const Page = await BookingsPage();
    render(Page);

    expect(mockBookingsClient).toHaveBeenCalledWith({
      activeBooking: mockBookings[0], // active booking
      inactiveBookings: [mockBookings[1], mockBookings[2]], // upcoming and past
      pagination: {
        page: 1,
        pageSize: 3,
        totalItems: 2,
        totalPages: 1,
      },
    });
  });

  it("should handle no active booking", async () => {
    const inactiveOnlyBookings = mockBookings.slice(1); // Remove active booking
    mockGetServerSession.mockResolvedValue({
      user: {
        id: "user123",
      },
    });
    mockGetClientBookingsPage.mockResolvedValue(createBookingsPageResult(inactiveOnlyBookings));

    const Page = await BookingsPage();
    render(Page);

    expect(mockBookingsClient).toHaveBeenCalledWith({
      activeBooking: null,
      inactiveBookings: inactiveOnlyBookings,
      pagination: {
        page: 1,
        pageSize: 3,
        totalItems: 2,
        totalPages: 1,
      },
    });
  });

  it("should handle empty bookings array", async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        id: "user123",
      },
    });
    mockGetClientBookingsPage.mockResolvedValue(createBookingsPageResult([]));

    const Page = await BookingsPage();
    render(Page);

    expect(mockBookingsClient).toHaveBeenCalledWith({
      activeBooking: null,
      inactiveBookings: [],
      pagination: {
        page: 1,
        pageSize: 3,
        totalItems: 0,
        totalPages: 1,
      },
    });
  });
});
