import { NextResponse } from "next/server";
import { getListingDetails } from "../../../../mock/hotel-details";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const listing = getListingDetails(id);

  if (!listing) {
    return NextResponse.json(
      { error: "Listing not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(listing);
}
