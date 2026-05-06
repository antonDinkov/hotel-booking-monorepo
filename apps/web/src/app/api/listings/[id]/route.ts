import { NextResponse } from "next/server";
import { getListingById } from "../../../../server/services/hotelPanel";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";

// API layer: thin wrapper that delegates to the service layer
export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await authorizeApi(["client", "admin"]);
    if (!auth.ok) {
        return NextResponse.json(auth.response, { status: auth.status });
    }

    const { id } = await params;

    const listing = await getListingById(id);

    if (!listing) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(listing);
}
