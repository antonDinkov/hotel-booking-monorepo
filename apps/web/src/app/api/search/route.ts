import { NextResponse } from "next/server";
import { searchAvailableHotelsPage } from "../../../server/services/hotelPanel";

function parsePositiveInt(value: string | null): number | undefined {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const destination = searchParams.get("destination");
        const checkInDate = searchParams.get("checkInDate");
        const checkOutDate = searchParams.get("checkOutDate");
        const guests = searchParams.get("guests");

        console.log({
            destination,
            checkInDate,
            checkOutDate,
            guests,
        });

        // Validate all required parameters
        if (!destination?.trim() || !checkInDate || !checkOutDate || !guests) {
            return NextResponse.json(
                {
                    error: {
                        message: "Missing required search parameters: destination, checkInDate, checkOutDate, guests",
                        code: "INVALID_SEARCH",
                    },
                },
                { status: 400 }
            );
        }

        // Validate date format and logic
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            return NextResponse.json(
                {
                    error: {
                        message: "Invalid date format. Use YYYY-MM-DD",
                        code: "INVALID_DATE",
                    },
                },
                { status: 400 }
            );
        }

        if (checkOut <= checkIn) {
            return NextResponse.json(
                {
                    error: {
                        message: "Check-out date must be after check-in date",
                        code: "INVALID_DATE_RANGE",
                    },
                },
                { status: 400 }
            );
        }

        const guestsCount = parseInt(guests, 10);
        if (isNaN(guestsCount) || guestsCount < 1) {
            return NextResponse.json(
                {
                    error: {
                        message: "Guests must be a positive number",
                        code: "INVALID_GUESTS",
                    },
                },
                { status: 400 }
            );
        }

        const page = parsePositiveInt(searchParams.get("page"));
        const pageSize = parsePositiveInt(searchParams.get("pageSize"));

        const results = await searchAvailableHotelsPage({
            destination,
            checkInDate,
            checkOutDate,
            guestsCount,
            pagination: { page, pageSize },
        });

        return NextResponse.json({
            data: results,
            meta: {
                page: results.pagination.page,
                limit: results.pagination.pageSize,
                hasMore: results.pagination.page < results.pagination.totalPages,
                total: results.pagination.totalItems,
            },
        }, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        console.error("Search API error:", error);

        return NextResponse.json(
            {
                error: {
                    message: "Failed to search hotels",
                    code: "SEARCH_ERROR",
                },
            },
            { status: 500 }
        );
    }
}
