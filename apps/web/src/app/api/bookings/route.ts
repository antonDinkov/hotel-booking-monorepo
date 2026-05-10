import { NextResponse } from "next/server";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { getBookings } from "@/server/services/bookings";

export async function GET() {
  const auth = await authorizeApi(["client", "admin"]);

  if (!auth.ok) {
    return NextResponse.json(auth.response, { status: auth.status });
  }

  const userId = auth.userId as string;
  const bookings = await getBookings(userId);

  return NextResponse.json({ data: bookings });
}

