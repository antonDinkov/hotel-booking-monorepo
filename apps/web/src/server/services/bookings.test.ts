// CRITICAL: Mock modules BEFORE any imports to prevent db/index.ts initialization
jest.resetModules();

jest.mock("@/db", () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
  },
}));

import { getBookings } from "./bookings";
import { db } from "@/db";

type MockDb = {
  select: jest.Mock;
  update: jest.Mock;
};

type MockBookingRow = {
  id: number;
  hotelId?: number | null;
  checkInDate: string;
  checkOutDate: string;
  roomsCount?: number | null;
  status?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  roomTypeName?: string | null;
  roomPrice?: number | null;
  hotelName?: string | null;
  hotelAddress?: string | null;
  hotelImageUrl?: string | null;
  reviewId?: number | null;
};

const mockDb = db as unknown as MockDb;

function createUpdateQuery() {
  return {
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    }),
  };
}

function createBookingsQuery(rows: MockBookingRow[], where = jest.fn()) {
  const orderBy = jest.fn().mockResolvedValue(rows);
  const query = {
    from: jest.fn(),
    leftJoin: jest.fn(),
    where,
  };

  query.from.mockReturnValue(query);
  query.leftJoin.mockReturnValue(query);
  query.where.mockReturnValue({ orderBy });

  return { query, orderBy, where };
}

function mockBookingRows(rows: MockBookingRow[], where?: jest.Mock) {
  const query = createBookingsQuery(rows, where);
  mockDb.select.mockReturnValue(query.query);
  return query;
}

function createRow(overrides: MockBookingRow): MockBookingRow {
  return {
    hotelId: 1,
    roomsCount: 1,
    status: "confirmed",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    roomTypeName: "Standard",
    roomPrice: 100,
    hotelName: "Test Hotel",
    hotelAddress: "Test St",
    hotelImageUrl: "https://example.com/image.jpg",
    reviewId: null,
    ...overrides,
  };
}

describe("bookings service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.update.mockReturnValue(createUpdateQuery());
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-09T00:00:00Z"));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("getBookings", () => {
    it("should return empty array for user with no bookings", async () => {
      mockBookingRows([]);

      const bookings = await getBookings("user-123");

      expect(bookings).toEqual([]);
      expect(bookings).toHaveLength(0);
    });

    it("should correctly map database row to MyBooking type", async () => {
      mockBookingRows([
        createRow({
          id: 1,
          checkInDate: "2026-05-20",
          checkOutDate: "2026-05-25",
          roomTypeName: "Deluxe",
          roomPrice: 150,
          hotelName: "Grand Hotel",
          hotelAddress: "123 Main St",
          hotelImageUrl: "https://example.com/image.jpg",
        }),
      ]);

      const bookings = await getBookings("user-123");

      expect(bookings).toHaveLength(1);
      expect(bookings[0]).toMatchObject({
        id: "1",
        hotelId: 1,
        hotelName: "Grand Hotel",
        hotelAddress: "123 Main St",
        hotelImage: "https://example.com/image.jpg",
        roomType: "Deluxe",
        checkIn: "2026-05-20",
        checkOut: "2026-05-25",
        totalPrice: 750,
        status: "upcoming",
        lifecycleStatus: "confirmed",
        paymentMethod: "stripe",
        paymentStatus: "paid",
        canCancel: true,
        canReview: false,
        hasReview: false,
      });
    });

    it("should compute upcoming status for future bookings", async () => {
      mockBookingRows([
        createRow({
          id: 1,
          checkInDate: "2026-06-01",
          checkOutDate: "2026-06-05",
        }),
      ]);

      const bookings = await getBookings("user-123");

      expect(bookings[0].status).toBe("upcoming");
      expect(bookings[0].daysRemaining).toBeUndefined();
    });

    it("should compute active status for current bookings", async () => {
      mockBookingRows([
        createRow({
          id: 1,
          checkInDate: "2026-05-05",
          checkOutDate: "2026-05-15",
        }),
      ]);

      const bookings = await getBookings("user-123");

      expect(bookings[0].status).toBe("active");
      expect(bookings[0].daysRemaining).toBe(6);
    });

    it("should compute past status for completed bookings", async () => {
      mockBookingRows([
        createRow({
          id: 1,
          checkInDate: "2026-04-15",
          checkOutDate: "2026-04-20",
        }),
      ]);

      const bookings = await getBookings("user-123");

      expect(bookings[0].status).toBe("past");
      expect(bookings[0].daysRemaining).toBeUndefined();
      expect(bookings[0].canReview).toBe(true);
    });

    it("should sort bookings by checkIn date DESC (furthest future first)", async () => {
      mockBookingRows([
        createRow({ id: 1, checkInDate: "2026-05-20", checkOutDate: "2026-05-25" }),
        createRow({ id: 2, checkInDate: "2026-06-10", checkOutDate: "2026-06-15" }),
        createRow({ id: 3, checkInDate: "2026-05-10", checkOutDate: "2026-05-12" }),
      ]);

      const bookings = await getBookings("user-123");

      expect(bookings).toHaveLength(3);
      expect(bookings[0].checkIn).toBe("2026-06-10");
      expect(bookings[1].checkIn).toBe("2026-05-20");
      expect(bookings[2].checkIn).toBe("2026-05-10");
    });

    it("should handle bookings with missing optional fields", async () => {
      mockBookingRows([
        createRow({
          id: 1,
          hotelId: null,
          checkInDate: "2026-05-20",
          checkOutDate: "2026-05-25",
          roomTypeName: null,
          roomPrice: null,
          hotelName: null,
          hotelAddress: null,
          hotelImageUrl: null,
        }),
      ]);

      const bookings = await getBookings("user-123");

      expect(bookings).toHaveLength(1);
      expect(bookings[0]).toMatchObject({
        hotelName: "Unknown hotel",
        hotelAddress: "",
        roomType: "Room",
        hotelImage: undefined,
        totalPrice: 0,
      });
    });

    it("should calculate total price correctly based on night count", async () => {
      mockBookingRows([
        createRow({
          id: 1,
          checkInDate: "2026-05-20",
          checkOutDate: "2026-05-27",
          roomTypeName: "Deluxe",
          roomPrice: 200,
        }),
      ]);

      const bookings = await getBookings("user-123");

      expect(bookings[0].totalPrice).toBe(1400);
    });

    it("should deduplicate rows with same booking ID", async () => {
      mockBookingRows([
        createRow({
          id: 1,
          checkInDate: "2026-05-20",
          checkOutDate: "2026-05-25",
          hotelImageUrl: "https://example.com/image1.jpg",
        }),
        createRow({
          id: 1,
          checkInDate: "2026-05-20",
          checkOutDate: "2026-05-25",
          hotelImageUrl: "https://example.com/image2.jpg",
        }),
      ]);

      const bookings = await getBookings("user-123");

      expect(bookings).toHaveLength(1);
      expect(bookings[0].hotelImage).toBe("https://example.com/image1.jpg");
    });

    it("should return bookings for correct userId", async () => {
      const mockWhere = jest.fn();
      mockBookingRows([
        createRow({
          id: 1,
          checkInDate: "2026-05-20",
          checkOutDate: "2026-05-25",
        }),
      ], mockWhere);

      await getBookings("specific-user-id");

      expect(mockWhere).toHaveBeenCalled();
    });

    it("should handle booking on today (boundary case - active)", async () => {
      mockBookingRows([
        createRow({
          id: 1,
          checkInDate: "2026-05-09",
          checkOutDate: "2026-05-15",
        }),
      ]);

      const bookings = await getBookings("user-123");

      expect(bookings[0].status).toBe("active");
      expect(bookings[0].daysRemaining).toBe(6);
    });

    it("should handle checkout on today (boundary case - active)", async () => {
      mockBookingRows([
        createRow({
          id: 1,
          checkInDate: "2026-05-05",
          checkOutDate: "2026-05-09",
        }),
      ]);

      const bookings = await getBookings("user-123");

      expect(bookings[0].status).toBe("active");
      expect(bookings[0].daysRemaining).toBe(0);
    });

    it("should return formatted date strings", async () => {
      mockBookingRows([
        createRow({
          id: 1,
          checkInDate: "2026-05-20",
          checkOutDate: "2026-05-25",
        }),
      ]);

      const bookings = await getBookings("user-123");

      expect(bookings[0].checkIn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(bookings[0].checkOut).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(bookings[0].checkIn).toBe("2026-05-20");
      expect(bookings[0].checkOut).toBe("2026-05-25");
    });
  });
});
