import { NextResponse } from "next/server";
import { getRoomAvailabilityForHotel } from "@/server/services/hotelPanel";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hotelIdParam } = await params;
    const { searchParams } = new URL(request.url);
    const checkInDate = searchParams.get("checkInDate");
    const checkOutDate = searchParams.get("checkOutDate");
    const guests = searchParams.get("guests");

    // Validate parameters
    if (!checkInDate || !checkOutDate || !guests) {
      return NextResponse.json(
        { error: { message: "Missing required parameters", code: "MISSING_PARAMS" } },
        { status: 400 }
      );
    }

    const hotelId = Number(hotelIdParam);
    if (Number.isNaN(hotelId)) {
      return NextResponse.json(
        { error: { message: "Invalid hotel ID", code: "INVALID_HOTEL_ID" } },
        { status: 400 }
      );
    }

    const guestsCount = Number(guests);
    if (Number.isNaN(guestsCount) || guestsCount < 1) {
      return NextResponse.json(
        { error: { message: "Invalid guests count", code: "INVALID_GUESTS" } },
        { status: 400 }
      );
    }

    const availability = await getRoomAvailabilityForHotel(
      hotelId,
      checkInDate,
      checkOutDate,
      guestsCount
    );

    const hasAvailability = availability.length > 0;

    return NextResponse.json({
      data: {
        hasAvailability,
        rooms: availability,
      },
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: { message: "Failed to check availability", code: "CHECK_ERROR" } },
      { status: 500 }
    );
  }
}
