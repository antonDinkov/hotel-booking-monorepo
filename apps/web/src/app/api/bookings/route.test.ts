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
}));

import { GET } from "./route";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { getBookings } from "@/server/services/bookings";

const mockAuthorizeApi = authorizeApi as jest.MockedFunction<any>;
const mockGetBookings = getBookings as jest.MockedFunction<any>;

describe("Bookings API GET", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthorized", async () => {
    mockAuthorizeApi.mockResolvedValue({ ok: false, status: 401, response: { error: "Unauthorized" } });

    const res = await GET();
    expect((res as any).status).toBe(401);
  });

  it("returns bookings when authorized", async () => {
    mockAuthorizeApi.mockResolvedValue({ ok: true, userId: "user-1" });
    mockGetBookings.mockResolvedValue([{ id: "b1" }]);

    const res = await GET();

    expect(mockGetBookings).toHaveBeenCalledWith("user-1");
    expect((res as any).status).toBe(200);
  });
});
