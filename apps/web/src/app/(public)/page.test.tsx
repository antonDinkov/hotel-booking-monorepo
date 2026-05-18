/**
 * @jest-environment node
 */

jest.resetModules();

jest.mock("@/db", () => ({
  db: { select: jest.fn() },
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/server/services/hotelPanel", () => ({
  __esModule: true,
  getHotelPanelData: jest.fn(),
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  __esModule: true,
  authorize: jest.fn(),
}));

import Home from "./page";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { getHotelPanelData } from "@/server/services/hotelPanel";
import { redirect } from "next/navigation";

const mockAuthorize = authorize as jest.Mock;
const mockGetHotelPanelData = getHotelPanelData as jest.Mock;
const mockedRedirect = jest.mocked(redirect);

beforeEach(() => {
  jest.clearAllMocks();
  mockedRedirect.mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  });
});

describe("Home page", () => {
  it("should redirect to dashboard when user is authenticated", async () => {
    mockAuthorize.mockResolvedValue({
      ok: true,
      session: { user: { id: "user1" } },
      roles: ["client"],
      userId: "user1",
    });

    await expect(Home()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockAuthorize).toHaveBeenCalledWith(["client", "partner", "admin"]);
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
    expect(mockGetHotelPanelData).not.toHaveBeenCalled();
  });

  it("should fetch and render panel data when user is not authenticated", async () => {
    mockAuthorize.mockResolvedValue({
      ok: false,
      error: "unauthenticated",
      session: null,
      roles: [],
      userId: null,
    });

    const panelData = {
      brand: { name: "BookYourStay" },
      navigation: {},
      hero: { title: "Welcome" },
      search: { cta: "Search" },
      searchFields: {},
      featuredHeading: { title: "Featured", subtitle: "Hotels" },
      featuredListings: [
        { id: "1", name: "Hotel A", location: "Paris" },
      ],
    };

    mockGetHotelPanelData.mockResolvedValue(panelData);

    const result = await Home();

    expect(mockAuthorize).toHaveBeenCalledWith(["client", "partner", "admin"]);
    expect(mockedRedirect).not.toHaveBeenCalled();
    expect(mockGetHotelPanelData).toHaveBeenCalledTimes(1);
    expect(result).not.toBeNull();
  });

  it("should return null when panel data is not available", async () => {
    mockAuthorize.mockResolvedValue({
      ok: false,
      error: "unauthenticated",
      session: null,
      roles: [],
      userId: null,
    });

    mockGetHotelPanelData.mockResolvedValue(null);

    const result = await Home();

    expect(result).toBeNull();
  });
});
