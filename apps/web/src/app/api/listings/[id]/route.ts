import { NextResponse } from "next/server";
import { getListingById } from "../../../../server/services/hotelPanel";

// API layer: thin wrapper that delegates to the service layer
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const listing = await getListingById(id);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json(listing);
}
