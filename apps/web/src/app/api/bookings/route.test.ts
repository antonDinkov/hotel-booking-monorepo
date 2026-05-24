jest.resetModules();

// Mock Next.js server helpers to avoid loading Next internals in Jest
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, opts?: any) => ({
      status: opts?.status ?? 200,
      headers: opts?.headers ?? {},
      json: async () => body,
    }),
  },
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authorizeApi: jest.fn(),
}));

jest.mock("@/server/services/bookings", () => ({
  getBookings: jest.fn(),
  getClientBookingsPage: jest.fn(),
}));

import { GET } from "./route";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { getBookings, getClientBookingsPage } from "@/server/services/bookings";

const mockAuthorizeApi = authorizeApi as jest.MockedFunction<any>;
const mockGetBookings = getBookings as jest.MockedFunction<any>;
const mockGetClientBookingsPage = getClientBookingsPage as jest.MockedFunction<any>;

describe("Bookings API GET", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthorized", async () => {
    mockAuthorizeApi.mockResolvedValue({ ok: false, status: 401, response: { error: "Unauthorized" } });

    const res = await GET();
    expect((res as any).status).toBe(401);
  });

  it("returns bookings when authorized", async () => {
    mockAuthorizeApi.mockResolvedValue({ ok: true, userId: "user-1" });
    mockGetClientBookingsPage.mockResolvedValue({
      activeBooking: null,
      inactiveBookings: [{ id: "b1" }],
      pagination: { page: 1, pageSize: 3, totalItems: 1, totalPages: 1 },
    });

    const res = await GET();

    expect(mockGetClientBookingsPage).toHaveBeenCalledWith("user-1", {
      page: 1,
      pageSize: undefined,
    });
    expect(mockGetBookings).not.toHaveBeenCalled();
    expect((res as any).status).toBe(200);
  });
});
