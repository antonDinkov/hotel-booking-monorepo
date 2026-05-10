/**
 * @jest-environment node
 */

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  __esModule: true,
  authorizeApi: jest.fn(),
}));

jest.mock("@/server/services/bookings", () => ({
  __esModule: true,
  getBookings: jest.fn(),
}));

import { GET } from "./route";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { getBookings } from "@/server/services/bookings";

const mockAuthorizeApi = authorizeApi as jest.Mock;
const mockGetBookings = getBookings as jest.Mock;

describe("bookings API route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns auth error response when authorization fails", async () => {
    mockAuthorizeApi.mockResolvedValue({
      ok: false,
      status: 403,
      response: { error: "Forbidden" },
      userId: null,
    });

    const response = await GET();

    expect(mockGetBookings).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
  });

  it("returns bookings data when authorized", async () => {
    mockAuthorizeApi.mockResolvedValue({
      ok: true,
      status: 200,
      response: {},
      userId: "user-1",
    });

    const bookingList = [
      { id: "1", hotelName: "Test Hotel" },
    ];

    mockGetBookings.mockResolvedValue(bookingList);

    const response = await GET();

    expect(mockAuthorizeApi).toHaveBeenCalledWith(["client", "admin"]);
    expect(mockGetBookings).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: bookingList });
  });
});
