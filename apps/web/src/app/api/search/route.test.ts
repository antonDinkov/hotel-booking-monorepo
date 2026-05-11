/**
 * @jest-environment node
 */

jest.mock("../../../server/services/hotelPanel", () => ({
  __esModule: true,
  searchAvailableHotels: jest.fn(),
}));

import { GET } from "./route";
import { searchAvailableHotels } from "../../../server/services/hotelPanel";

const mockSearchAvailableHotels = searchAvailableHotels as jest.Mock;

describe("search API route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when destination is missing", async () => {
    const url = "http://localhost:3000/api/search?checkInDate=2025-05-15&checkOutDate=2025-05-20&guests=2";
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_SEARCH");
  });

  it("returns 400 when checkInDate is missing", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkOutDate=2025-05-20&guests=2";
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_SEARCH");
  });

  it("returns 400 when checkOutDate is missing", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkInDate=2025-05-15&guests=2";
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_SEARCH");
  });

  it("returns 400 when guests is missing", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkInDate=2025-05-15&checkOutDate=2025-05-20";
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_SEARCH");
  });

  it("returns 400 when destination is empty", async () => {
    const url = "http://localhost:3000/api/search?destination=&checkInDate=2025-05-15&checkOutDate=2025-05-20&guests=2";
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_SEARCH");
  });

  it("returns 400 when checkInDate is invalid format", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkInDate=invalid&checkOutDate=2025-05-20&guests=2";
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_DATE");
  });

  it("returns 400 when checkOutDate is invalid format", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkInDate=2025-05-15&checkOutDate=invalid&guests=2";
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_DATE");
  });

  it("returns 400 when checkOut is before checkIn", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkInDate=2025-05-20&checkOutDate=2025-05-15&guests=2";
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_DATE_RANGE");
  });

  it("returns 400 when checkOut equals checkIn", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkInDate=2025-05-15&checkOutDate=2025-05-15&guests=2";
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_DATE_RANGE");
  });

  it("returns 400 when guests is not a number", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkInDate=2025-05-15&checkOutDate=2025-05-20&guests=abc";
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_GUESTS");
  });

  it("returns 400 when guests is zero", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkInDate=2025-05-15&checkOutDate=2025-05-20&guests=0";
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_GUESTS");
  });

  it("returns 400 when guests is negative", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkInDate=2025-05-15&checkOutDate=2025-05-20&guests=-1";
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_GUESTS");
  });

  it("returns 200 with results when all parameters are valid", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkInDate=2025-05-15&checkOutDate=2025-05-20&guests=2";
    const request = new Request(url);

    const mockResults = [
      { id: "1", name: "Hotel A", price: 100 },
      { id: "2", name: "Hotel B", price: 150 },
    ];

    mockSearchAvailableHotels.mockResolvedValue(mockResults);

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockSearchAvailableHotels).toHaveBeenCalledWith("Paris", "2025-05-15", "2025-05-20", 2);
    expect(await response.json()).toEqual(mockResults);
  });

  it("includes cache control headers in successful response", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkInDate=2025-05-15&checkOutDate=2025-05-20&guests=2";
    const request = new Request(url);

    mockSearchAvailableHotels.mockResolvedValue([]);

    const response = await GET(request);

    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=60, stale-while-revalidate=300");
  });

  it("returns 500 when service throws error", async () => {
    const url = "http://localhost:3000/api/search?destination=Paris&checkInDate=2025-05-15&checkOutDate=2025-05-20&guests=2";
    const request = new Request(url);

    mockSearchAvailableHotels.mockRejectedValue(new Error("Database error"));

    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error.code).toBe("SEARCH_ERROR");
  });
});
