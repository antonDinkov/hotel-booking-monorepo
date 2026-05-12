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

jest.mock("../../../server/services/hotelPanel", () => ({
  searchAvailableHotels: jest.fn(),
}));

import { GET } from "./route";
import { searchAvailableHotels } from "../../../server/services/hotelPanel";

const mockSearch = searchAvailableHotels as jest.MockedFunction<any>;

describe("Search API GET", () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("returns 400 when required params are missing", async () => {
    const req = { url: "http://localhost/api/search" } as unknown as Request;
    const res = await GET(req);
    expect((res as any).status).toBe(400);
  });

  it("returns 400 when date range is invalid", async () => {
    const req = { url: "http://localhost/api/search?destination=Paris&checkInDate=2026-05-20&checkOutDate=2026-05-19&guests=2" } as unknown as Request;
    const res = await GET(req);
    expect((res as any).status).toBe(400);
  });

  it("calls searchAvailableHotels and returns 200 on valid params", async () => {
    mockSearch.mockResolvedValue({ data: [{ id: "1", name: "Hotel" }] });

    const req = { url: "http://localhost/api/search?destination=Paris&checkInDate=2026-05-20&checkOutDate=2026-05-21&guests=2" } as unknown as Request;
    const res = await GET(req);

    expect(mockSearch).toHaveBeenCalledWith("Paris", "2026-05-20", "2026-05-21", 2);
    expect((res as any).status).toBe(200);
  });

  it("returns 500 on service error", async () => {
    mockSearch.mockRejectedValue(new Error("boom"));
    const req = { url: "http://localhost/api/search?destination=Paris&checkInDate=2026-05-20&checkOutDate=2026-05-21&guests=2" } as unknown as Request;
    const res = await GET(req);
    expect((res as any).status).toBe(500);
  });

  it("returns 400 when date format is invalid", async () => {
    const req = { url: "http://localhost/api/search?destination=Paris&checkInDate=invalid-date&checkOutDate=2026-05-21&guests=2" } as unknown as Request;
    const res = await GET(req);
    expect((res as any).status).toBe(400);
  });

  it("returns 400 when guests is not a positive number", async () => {
    const req = { url: "http://localhost/api/search?destination=Paris&checkInDate=2026-05-20&checkOutDate=2026-05-21&guests=0" } as unknown as Request;
    const res = await GET(req);
    expect((res as any).status).toBe(400);
  });
});

