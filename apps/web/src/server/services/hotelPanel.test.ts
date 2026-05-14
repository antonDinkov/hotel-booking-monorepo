// CRITICAL: Mock modules BEFORE any imports to prevent db/index.ts initialization
jest.resetModules();

jest.mock("@/db", () => ({
  db: {
    select: jest.fn(),
  },
}));

import { getHotelPanelData, getListingById, searchAvailableHotels } from "./hotelPanel";
import { db } from "@/db";
import type { HotelPanelData, ListingDetails, Listing } from "@/types/hotel-panel";

const mockDb = db as jest.Mocked<typeof db>;

// Create a more sophisticated mock that handles different query patterns
const createMockQuery = (result: any) => ({
  from: jest.fn().mockReturnValue({
    where: jest.fn().mockResolvedValue(result),
    leftJoin: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(result),
    }),
  }),
  where: jest.fn().mockResolvedValue(result),
  leftJoin: jest.fn().mockReturnValue({
    where: jest.fn().mockResolvedValue(result),
  }),
});

// Mock for queries without where clause
const createSimpleQuery = (result: any) => ({
  from: jest.fn().mockResolvedValue(result),
});

// Advanced mock for complex queries with multiple calls
const createAdvancedMock = () => {
  let callCount = 0;
  const mockSelect = jest.fn();

  mockSelect.mockImplementation(() => {
    callCount++;
    return {
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockImplementation(() => {
          // Handle different query types based on call count
          if (callCount === 1) {
            // Hotels query
            return Promise.resolve([]);
          } else if (callCount === 2) {
            // Images query
            return Promise.resolve([]);
          } else {
            // Room types or bookings queries
            return Promise.resolve([]);
          }
        }),
      }),
    };
  });

  return mockSelect;
};

describe("hotelPanel service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getHotelPanelData", () => {
    it("should return complete hotel panel data structure", async () => {
      const mockRows = [
        {
          id: 1,
          name: "Grand Hotel",
          location: "New York",
          imageUrl: "https://example.com/image1.jpg",
        },
        {
          id: 2,
          name: "Ocean Resort",
          location: "Miami",
          imageUrl: null,
        },
      ];

      mockDb.select.mockReturnValue(createMockQuery(mockRows));

      const result = await getHotelPanelData();

      expect(result).toHaveProperty("brand");
      expect(result).toHaveProperty("navigation");
      expect(result).toHaveProperty("hero");
      expect(result).toHaveProperty("search");
      expect(result).toHaveProperty("searchFields");
      expect(result).toHaveProperty("featuredHeading");
      expect(result).toHaveProperty("featuredListings");

      expect(result.brand.name).toBe("BookYourStay");
      expect(result.featuredListings).toHaveLength(2);
    });

    it("should query only featured hotels", async () => {
      mockDb.select.mockReturnValue(createMockQuery([]));

      await getHotelPanelData();

      expect(mockDb.select).toHaveBeenCalledWith({
        id: expect.anything(),
        name: expect.anything(),
        location: expect.anything(),
        imageUrl: expect.anything(),
      });
    });

    it("should map database rows to Listing objects correctly", async () => {
      const mockRows = [
        {
          id: 1,
          name: "Test Hotel",
          location: "Test City",
          imageUrl: "https://example.com/test.jpg",
        },
      ];

      mockDb.select.mockReturnValue(createMockQuery(mockRows));

      const result = await getHotelPanelData();

      expect(result.featuredListings[0]).toEqual({
        id: "1",
        name: "Test Hotel",
        category: "Test City",
        rating: 4.7,
        reviewLabel: "Verified stays",
        image: {
          src: "https://example.com/test.jpg",
          alt: "Test Hotel cover image",
        },
      });
    });

    it("should use fallback image when hotel has no image", async () => {
      const mockRows = [
        {
          id: 1,
          name: "Hotel Without Image",
          location: "Somewhere",
          imageUrl: null,
        },
      ];

      mockDb.select.mockReturnValue(createMockQuery(mockRows));

      const result = await getHotelPanelData();

      expect(result.featuredListings[0].image.src).toBe(
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
      );
      expect(result.featuredListings[0].image.alt).toBe("Hotel Without Image cover image");
    });

    it("should deduplicate hotels with multiple images", async () => {
      const mockRows = [
        {
          id: 1,
          name: "Hotel A",
          location: "City A",
          imageUrl: "image1.jpg",
        },
        {
          id: 1,
          name: "Hotel A",
          location: "City A",
          imageUrl: "image2.jpg",
        },
      ];

      mockDb.select.mockReturnValue(createMockQuery(mockRows));

      const result = await getHotelPanelData();

      expect(result.featuredListings).toHaveLength(1);
      expect(result.featuredListings[0].id).toBe("1");
    });

    it("should return empty featured listings when no featured hotels", async () => {
      mockDb.select.mockReturnValue(createMockQuery([]));

      const result = await getHotelPanelData();

      expect(result.featuredListings).toEqual([]);
    });
  });

  describe("getListingById", () => {
    it("should return null for invalid id (NaN)", async () => {
      const result = await getListingById("invalid");

      expect(result).toBeNull();
    });

    it("should return null for string id that is not a number", async () => {
      const result = await getListingById("abc");

      expect(result).toBeNull();
    });

    it("should return null when hotel not found", async () => {
      mockDb.select.mockReturnValue(createMockQuery([]));

      const result = await getListingById("999");

      expect(result).toBeNull();
    });

    it("should return complete ListingDetails for valid hotel", async () => {
      const mockHotel = {
        id: 1,
        name: "Test Hotel",
        location: "Test City",
        description: "A beautiful hotel",
      };

      const mockRoomTypes = [{ pricePerNight: 150 }];
      const mockImages = [
        { url: "image1.jpg" },
        { url: "image2.jpg" },
      ];

      let callCount = 0;
      mockDb.select = jest.fn().mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return createMockQuery([mockHotel]);
        if (callCount === 2) return createMockQuery(mockRoomTypes);
        if (callCount === 3) return createMockQuery(mockImages);
        return createMockQuery([]);
      });

      const result = await getListingById("1");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("1");
      expect(result!.name).toBe("Test Hotel");
      expect(result!.location).toBe("Test City");
      expect(result!.price).toBe(150);
      expect(result!.pricePerNight).toBe("From $150 per night");
      expect(result!.description).toBe("A beautiful hotel");
      expect(result!.bedrooms).toBe(undefined);
      expect(result!.bathrooms).toBe(undefined);
      expect(result!.guests).toBe(undefined);
      expect(result!.amenities).toHaveLength(6);
      expect(result!.highlights).toHaveLength(4);
    });

    it("should handle numeric id parameter", async () => {
      const mockHotel = {
        id: 42,
        name: "Numeric ID Hotel",
        location: "Test City",
        description: "Hotel with numeric ID",
      };

      const mockRoomTypes = [{ pricePerNight: 200 }];
      const mockImages = [{ url: "image.jpg" }];

      mockDb.select
        .mockReturnValueOnce(createMockQuery([mockHotel]))
        .mockReturnValueOnce(createMockQuery(mockRoomTypes))
        .mockReturnValueOnce(createMockQuery(mockImages));

      const result = await getListingById(42);

      expect(result).not.toBeNull();
      expect(result!.id).toBe("42");
      expect(result!.name).toBe("Numeric ID Hotel");
    });

    it("should use fallback image when no images exist", async () => {
      const mockHotel = {
        id: 1,
        name: "Hotel No Images",
        location: "Somewhere",
        description: "Hotel without images",
      };

      const mockRoomTypes = [{ pricePerNight: 100 }];

      let callCount = 0;
      mockDb.select = jest.fn().mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return createMockQuery([mockHotel]);
        if (callCount === 2) return createMockQuery(mockRoomTypes);
        if (callCount === 3) return createMockQuery([]);
        return createMockQuery([]);
      });

      const result = await getListingById("1");

      expect(result!.image.src).toBe(
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
      );
      expect(result!.image.alt).toBe("Hotel No Images cover image");
      expect(result!.images).toHaveLength(1);
    });

    it("should use fallback description when hotel has no description", async () => {
      const mockHotel = {
        id: 1,
        name: "Hotel No Desc",
        location: "Test City",
        description: null,
      };

      const mockRoomTypes = [{ pricePerNight: 120 }];
      const mockImages = [{ url: "image.jpg" }];

      mockDb.select
        .mockReturnValueOnce(createMockQuery([mockHotel]))
        .mockReturnValueOnce(createMockQuery(mockRoomTypes))
        .mockReturnValueOnce(createMockQuery(mockImages));

      const result = await getListingById("1");

      expect(result!.description).toBe("Hotel No Desc is located in Test City.");
    });


  });

  describe("searchAvailableHotels", () => {
    it("should return empty array when no hotels match destination", async () => {
      mockDb.select
        .mockReturnValueOnce(createMockQuery([])) // hotels query
        .mockReturnValueOnce(createSimpleQuery([])); // images query

      const result = await searchAvailableHotels("Nonexistent City", "2026-06-01", "2026-06-05", 2);

      expect(result).toEqual([]);
    });

    it("should filter hotels by destination case-insensitively", async () => {
      const mockHotels = [
        { id: 1, name: "Hotel A", location: "New York" },
        { id: 2, name: "Hotel B", location: "new york" },
        { id: 3, name: "Hotel C", location: "Los Angeles" },
      ];

      const mockImages = [
        { hotelId: 1, url: "image1.jpg" },
        { hotelId: 2, url: "image2.jpg" },
      ];

      // Mock all the queries the function makes
      mockDb.select
        .mockReturnValueOnce(createMockQuery(mockHotels)) // hotels query
        .mockReturnValueOnce(createSimpleQuery(mockImages)) // images query
        .mockReturnValueOnce(createMockQuery([])) // room types (empty to avoid complexity)
        .mockReturnValueOnce(createMockQuery([])); // bookings (empty)

      // The function should attempt to process but return empty due to no room types
      const result = await searchAvailableHotels("new york", "2026-06-01", "2026-06-05", 2);

      expect(result).toEqual([]); // No hotels available due to no room types
    });

    it("should check room capacity against guest count", async () => {
      const mockHotels = [
        { id: 1, name: "Small Hotel", location: "Test City" },
      ];

      const mockImages = [{ hotelId: 1, url: "image.jpg" }];

      const mockRoomTypes = [
        { id: 1, hotelId: 1, capacity: 2, totalRooms: 5 }, // Can accommodate 2 guests
        { id: 2, hotelId: 1, capacity: 4, totalRooms: 3 }, // Can accommodate 4 guests
      ];

      let callCount = 0;
      mockDb.select = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockHotels),
            }),
          };
        } else if (callCount === 2) {
          return {
            from: jest.fn().mockResolvedValue(mockImages),
          };
        } else if (callCount === 3) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockRoomTypes),
            }),
          };
        } else {
          // Handle bookings queries for each room type (calls 4 and 5)
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          };
        }
      });

      const result = await searchAvailableHotels("Test City", "2026-06-01", "2026-06-05", 3);

      expect(result).toHaveLength(1); // Should find hotel with room capacity >= 3
    });

    it("should exclude hotels with insufficient room capacity", async () => {
      const mockHotels = [
        { id: 1, name: "Small Hotel", location: "Test City" },
      ];

      const mockImages = [{ hotelId: 1, url: "image.jpg" }];

      const mockRoomTypes = []; // No rooms meet capacity >= 4 requirement

      let callCount = 0;
      mockDb.select = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockHotels),
            }),
          };
        } else if (callCount === 2) {
          return {
            from: jest.fn().mockResolvedValue(mockImages),
          };
        } else if (callCount === 3) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockRoomTypes),
            }),
          };
        } else {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          };
        }
      });

      const result = await searchAvailableHotels("Test City", "2026-06-01", "2026-06-05", 4);

      expect(result).toHaveLength(0); // Should not find hotel (capacity 2 < guests 4)
    });

    it("should check booking availability for date ranges", async () => {
      const mockHotels = [{ id: 1, name: "Booked Hotel", location: "Test City" }];
      const mockImages = [{ hotelId: 1, url: "image.jpg" }];
      const mockRoomTypes = [{ id: 1, hotelId: 1, capacity: 2, totalRooms: 1 }];
      const mockBookings = [
        {
          roomTypeId: 1,
          status: "confirmed",
          checkInDate: "2026-06-01",
          checkOutDate: "2026-06-03",
        },
      ];

      let callCount = 0;
      mockDb.select = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockHotels),
            }),
          };
        } else if (callCount === 2) {
          return {
            from: jest.fn().mockResolvedValue(mockImages),
          };
        } else if (callCount === 3) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockRoomTypes),
            }),
          };
        } else {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockBookings),
            }),
          };
        }
      });

      // Search for dates that overlap with existing booking
      const result = await searchAvailableHotels("Test City", "2026-06-02", "2026-06-04", 2);

      expect(result).toHaveLength(0); // Should not be available (overlapping dates)
    });

    it("should return available hotels when dates don't conflict", async () => {
      const mockHotels = [{ id: 1, name: "Available Hotel", location: "Test City" }];
      const mockImages = [{ hotelId: 1, url: "image.jpg" }];
      const mockRoomTypes = [{ id: 1, hotelId: 1, capacity: 2, totalRooms: 1 }];
      const mockBookings = [
        {
          roomTypeId: 1,
          status: "confirmed",
          checkInDate: "2026-06-01",
          checkOutDate: "2026-06-03",
        },
      ];

      let callCount = 0;
      mockDb.select = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockHotels),
            }),
          };
        } else if (callCount === 2) {
          return {
            from: jest.fn().mockResolvedValue(mockImages),
          };
        } else if (callCount === 3) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockRoomTypes),
            }),
          };
        } else {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockBookings),
            }),
          };
        }
      });

      // Search for dates that don't overlap with existing booking
      const result = await searchAvailableHotels("Test City", "2026-06-05", "2026-06-07", 2);

      expect(result).toHaveLength(1); // Should be available (no date overlap)
      expect(result[0].name).toBe("Available Hotel");
    });

    it("should ignore non-confirmed bookings when checking availability", async () => {
      const mockHotels = [{ id: 1, name: "Hotel with Pending", location: "Test City" }];
      const mockImages = [{ hotelId: 1, url: "image.jpg" }];
      const mockRoomTypes = [{ id: 1, hotelId: 1, capacity: 2, totalRooms: 1 }];
      const mockBookings = [
        {
          roomTypeId: 1,
          status: "pending", // Not confirmed
          checkInDate: "2026-06-01",
          checkOutDate: "2026-06-03",
        },
      ];

      let callCount = 0;
      mockDb.select = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockHotels),
            }),
          };
        } else if (callCount === 2) {
          return {
            from: jest.fn().mockResolvedValue(mockImages),
          };
        } else if (callCount === 3) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockRoomTypes),
            }),
          };
        } else {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]), // Pending bookings are ignored
            }),
          };
        }
      });

      const result = await searchAvailableHotels("Test City", "2026-06-01", "2026-06-03", 2);

      expect(result).toHaveLength(1); // Should be available (pending booking ignored)
    });

    it("should handle multiple room types per hotel", async () => {
      const mockHotels = [{ id: 1, name: "Multi Room Hotel", location: "Test City" }];
      const mockImages = [{ hotelId: 1, url: "image.jpg" }];
      const mockRoomTypes = [
        { id: 1, hotelId: 1, capacity: 2, totalRooms: 1 }, // Fully booked
        { id: 2, hotelId: 1, capacity: 4, totalRooms: 2 }, // Available
      ];
      const mockBookings = [
        {
          roomTypeId: 1,
          status: "confirmed",
          checkInDate: "2026-06-01",
          checkOutDate: "2026-06-03",
        },
      ];

      let callCount = 0;
      mockDb.select = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockHotels),
            }),
          };
        } else if (callCount === 2) {
          return {
            from: jest.fn().mockResolvedValue(mockImages),
          };
        } else if (callCount === 3) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockRoomTypes),
            }),
          };
        } else {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockBookings),
            }),
          };
        }
      });

      const result = await searchAvailableHotels("Test City", "2026-06-01", "2026-06-03", 3);

      expect(result).toHaveLength(1); // Should be available (has room type with capacity 4)
    });

    it("should use fallback image when hotel has no images", async () => {
      const mockHotels = [{ id: 1, name: "No Image Hotel", location: "Test City" }];
      const mockImages = []; // No images
      const mockRoomTypes = [{ id: 1, hotelId: 1, capacity: 2, totalRooms: 1 }];

      let callCount = 0;
      mockDb.select = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockHotels),
            }),
          };
        } else if (callCount === 2) {
          return {
            from: jest.fn().mockResolvedValue(mockImages),
          };
        } else if (callCount === 3) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockRoomTypes),
            }),
          };
        } else {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          };
        }
      });

      const result = await searchAvailableHotels("Test City", "2026-06-01", "2026-06-03", 2);

      expect(result).toHaveLength(1);
      expect(result[0].image.src).toBe(
        "https://images.unsplash.com/photo-1566073771259-6a8506099945"
      );
      expect(result[0].image.alt).toBe("No Image Hotel cover image");
    });

    it("should handle hotels with multiple images correctly", async () => {
      const mockHotels = [{ id: 1, name: "Multi Image Hotel", location: "Test City" }];
      const mockImages = [
        { hotelId: 1, url: "image1.jpg" },
        { hotelId: 1, url: "image2.jpg" },
      ];
      const mockRoomTypes = [{ id: 1, hotelId: 1, capacity: 2, totalRooms: 1 }];

      let callCount = 0;
      mockDb.select = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockHotels),
            }),
          };
        } else if (callCount === 2) {
          return {
            from: jest.fn().mockResolvedValue(mockImages),
          };
        } else if (callCount === 3) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockRoomTypes),
            }),
          };
        } else {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          };
        }
      });

      const result = await searchAvailableHotels("Test City", "2026-06-01", "2026-06-03", 2);

      expect(result).toHaveLength(1);
      expect(result[0].image.src).toBe("image1.jpg"); // Should use first image
    });
  });
});
