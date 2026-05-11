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
  getHotelPanelData: jest.fn(),
}));

import { GET } from "./route";
import { getHotelPanelData } from "../../../server/services/hotelPanel";

const mockGetPanel = getHotelPanelData as jest.MockedFunction<any>;

describe("Hotel Panel API GET", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns panel data", async () => {
    const data = { hotels: [], stats: {} };
    mockGetPanel.mockResolvedValue(data);

    const res = await GET();

    expect(mockGetPanel).toHaveBeenCalled();
    expect((res as any).status).toBe(200);
  });
});
