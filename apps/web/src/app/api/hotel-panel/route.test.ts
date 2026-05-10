/**
 * @jest-environment node
 */

jest.mock("@/server/services/hotelPanel", () => ({
  __esModule: true,
  getHotelPanelData: jest.fn(),
}));

import { GET } from "./route";
import { getHotelPanelData } from "@/server/services/hotelPanel";

const mockGetHotelPanelData = getHotelPanelData as jest.Mock;

describe("hotel-panel API route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns panel data as JSON when service succeeds", async () => {
    const panelData = {
      brand: { name: "HotelPanel" },
      featuredListings: [{ id: "1", title: "Hotel A" }],
    };

    mockGetHotelPanelData.mockResolvedValue(panelData);

    const response = await GET();

    expect(mockGetHotelPanelData).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(panelData);
  });

  it("returns empty JSON when service returns no content", async () => {
    mockGetHotelPanelData.mockResolvedValue({});

    const response = await GET();

    expect(mockGetHotelPanelData).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({});
  });
});
