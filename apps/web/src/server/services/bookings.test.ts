// CRITICAL: Mock modules BEFORE any imports to prevent db/index.ts initialization
jest.resetModules();

jest.mock("@/db", () => ({
  db: {
    select: jest.fn(),
  },
}));

import { getBookings } from "./bookings";
import { db } from "@/db";
import type { MyBooking } from "@/types/booking";

const mockDb = db as jest.Mocked<typeof db>;

describe("bookings service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set fixed date for consistent testing (May 9, 2026)
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-09T00:00:00Z"));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("getBookings", () => {
    it("should return empty array for user with no bookings", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      const bookings = await getBookings("user-123");

      expect(bookings).toEqual([]);
      expect(bookings).toHaveLength(0);
    });

    it("should correctly map database row to MyBooking type", async () => {
      const mockRow = {
        id: 1,
        checkInDate: "2026-05-20",
        checkOutDate: "2026-05-25",
        roomTypeName: "Deluxe",
        roomPrice: 150,
        hotelName: "Grand Hotel",
        hotelAddress: "123 Main St",
        hotelImageUrl: "https://example.com/image.jpg",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue([mockRow]),
                }),
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      const bookings = await getBookings("user-123");

      expect(bookings).toHaveLength(1);
      expect(bookings[0]).toMatchObject({
        id: "1",
        hotelName: "Grand Hotel",
        hotelAddress: "123 Main St",
        hotelImage: "https://example.com/image.jpg",
        roomType: "Deluxe",
        checkIn: "2026-05-20",
        checkOut: "2026-05-25",
        totalPrice: 750, // 150 * 5 nights
        status: "upcoming",
      });
    });

    it("should compute upcoming status for future bookings", async () => {
      const mockRow = {
        id: 1,
        checkInDate: "2026-06-01",
        checkOutDate: "2026-06-05",
        roomTypeName: "Standard",
        roomPrice: 100,
        hotelName: "Test Hotel",
        hotelAddress: "Test St",
        hotelImageUrl: "https://example.com/image.jpg",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue([mockRow]),
                }),
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      const bookings = await getBookings("user-123");

      expect(bookings[0].status).toBe("upcoming");
      expect(bookings[0].daysRemaining).toBeUndefined();
    });

    it("should compute active status for current bookings", async () => {
      const mockRow = {
        id: 1,
        checkInDate: "2026-05-05",
        checkOutDate: "2026-05-15",
        roomTypeName: "Standard",
        roomPrice: 100,
        hotelName: "Test Hotel",
        hotelAddress: "Test St",
        hotelImageUrl: "https://example.com/image.jpg",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue([mockRow]),
                }),
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      const bookings = await getBookings("user-123");

      expect(bookings[0].status).toBe("active");
      expect(bookings[0].daysRemaining).toBe(6); // May 15 - May 9 = 6 days
    });

    it("should compute past status for completed bookings", async () => {
      const mockRow = {
        id: 1,
        checkInDate: "2026-04-15",
        checkOutDate: "2026-04-20",
        roomTypeName: "Standard",
        roomPrice: 100,
        hotelName: "Test Hotel",
        hotelAddress: "Test St",
        hotelImageUrl: "https://example.com/image.jpg",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue([mockRow]),
                }),
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      const bookings = await getBookings("user-123");

      expect(bookings[0].status).toBe("past");
      expect(bookings[0].daysRemaining).toBeUndefined();
    });

    it("should sort bookings by checkIn date DESC (furthest future first)", async () => {
      const mockRows = [
        {
          id: 1,
          checkInDate: "2026-05-20",
          checkOutDate: "2026-05-25",
          roomTypeName: "Standard",
          roomPrice: 100,
          hotelName: "Hotel 1",
          hotelAddress: "St 1",
          hotelImageUrl: "https://example.com/1.jpg",
        },
        {
          id: 2,
          checkInDate: "2026-06-10",
          checkOutDate: "2026-06-15",
          roomTypeName: "Standard",
          roomPrice: 100,
          hotelName: "Hotel 2",
          hotelAddress: "St 2",
          hotelImageUrl: "https://example.com/2.jpg",
        },
        {
          id: 3,
          checkInDate: "2026-05-10",
          checkOutDate: "2026-05-12",
          roomTypeName: "Standard",
          roomPrice: 100,
          hotelName: "Hotel 3",
          hotelAddress: "St 3",
          hotelImageUrl: "https://example.com/3.jpg",
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue(mockRows),
                }),
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      const bookings = await getBookings("user-123");

      expect(bookings).toHaveLength(3);
      expect(bookings[0].checkIn).toBe("2026-06-10"); // Furthest future first
      expect(bookings[1].checkIn).toBe("2026-05-20");
      expect(bookings[2].checkIn).toBe("2026-05-10");
    });

    it("should handle bookings with missing optional fields", async () => {
      const mockRow = {
        id: 1,
        checkInDate: "2026-05-20",
        checkOutDate: "2026-05-25",
        roomTypeName: null,
        roomPrice: null,
        hotelName: null,
        hotelAddress: null,
        hotelImageUrl: null,
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue([mockRow]),
                }),
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      const bookings = await getBookings("user-123");

      expect(bookings).toHaveLength(1);
      expect(bookings[0]).toMatchObject({
        hotelName: "Unknown hotel",
        hotelAddress: "",
        roomType: "Room",
        hotelImage: undefined,
        totalPrice: 0, // null room price defaults to 0
      });
    });

    it("should calculate total price correctly based on night count", async () => {
      const mockRow = {
        id: 1,
        checkInDate: "2026-05-20",
        checkOutDate: "2026-05-27", // 7 nights
        roomTypeName: "Deluxe",
        roomPrice: 200,
        hotelName: "Test Hotel",
        hotelAddress: "Test St",
        hotelImageUrl: "https://example.com/image.jpg",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue([mockRow]),
                }),
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      const bookings = await getBookings("user-123");

      expect(bookings[0].totalPrice).toBe(1400); // 200 * 7 nights
    });

    it("should deduplicate rows with same booking ID", async () => {
      // Multiple rows for same booking (from multiple images)
      const mockRows = [
        {
          id: 1,
          checkInDate: "2026-05-20",
          checkOutDate: "2026-05-25",
          roomTypeName: "Standard",
          roomPrice: 100,
          hotelName: "Test Hotel",
          hotelAddress: "Test St",
          hotelImageUrl: "https://example.com/image1.jpg",
        },
        {
          id: 1, // Same booking ID
          checkInDate: "2026-05-20",
          checkOutDate: "2026-05-25",
          roomTypeName: "Standard",
          roomPrice: 100,
          hotelName: "Test Hotel",
          hotelAddress: "Test St",
          hotelImageUrl: "https://example.com/image2.jpg",
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue(mockRows),
                }),
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      const bookings = await getBookings("user-123");

      expect(bookings).toHaveLength(1); // Should have only 1 booking, not 2
      expect(bookings[0].hotelImage).toBe("https://example.com/image1.jpg"); // First image used
    });

    it("should return bookings for correct userId", async () => {
      const mockRow = {
        id: 1,
        checkInDate: "2026-05-20",
        checkOutDate: "2026-05-25",
        roomTypeName: "Standard",
        roomPrice: 100,
        hotelName: "Test Hotel",
        hotelAddress: "Test St",
        hotelImageUrl: "https://example.com/image.jpg",
      };

      const mockWhere = jest.fn().mockReturnValue({
        orderBy: jest.fn().mockResolvedValue([mockRow]),
      });

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: mockWhere,
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      await getBookings("specific-user-id");

      expect(mockWhere).toHaveBeenCalled();
    });

    it("should handle booking on today (boundary case - active)", async () => {
      const mockRow = {
        id: 1,
        checkInDate: "2026-05-09", // Today
        checkOutDate: "2026-05-15",
        roomTypeName: "Standard",
        roomPrice: 100,
        hotelName: "Test Hotel",
        hotelAddress: "Test St",
        hotelImageUrl: "https://example.com/image.jpg",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue([mockRow]),
                }),
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      const bookings = await getBookings("user-123");

      expect(bookings[0].status).toBe("active");
      expect(bookings[0].daysRemaining).toBe(6); // May 15 - May 9 = 6 days
    });

    it("should handle checkout on today (boundary case - active)", async () => {
      const mockRow = {
        id: 1,
        checkInDate: "2026-05-05",
        checkOutDate: "2026-05-09", // Today
        roomTypeName: "Standard",
        roomPrice: 100,
        hotelName: "Test Hotel",
        hotelAddress: "Test St",
        hotelImageUrl: "https://example.com/image.jpg",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue([mockRow]),
                }),
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      const bookings = await getBookings("user-123");

      expect(bookings[0].status).toBe("active");
      expect(bookings[0].daysRemaining).toBe(0); // Same day checkout
    });

    it("should return formatted date strings", async () => {
      const mockRow = {
        id: 1,
        checkInDate: "2026-05-20",
        checkOutDate: "2026-05-25",
        roomTypeName: "Standard",
        roomPrice: 100,
        hotelName: "Test Hotel",
        hotelAddress: "Test St",
        hotelImageUrl: "https://example.com/image.jpg",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue([mockRow]),
                }),
              }),
            }),
          }),
        }),
      });

      mockDb.select = mockSelect;

      const bookings = await getBookings("user-123");

      expect(bookings[0].checkIn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(bookings[0].checkOut).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(bookings[0].checkIn).toBe("2026-05-20");
      expect(bookings[0].checkOut).toBe("2026-05-25");
    });
  });
});
