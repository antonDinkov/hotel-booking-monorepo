import { NextResponse } from "next/server";
import { getHotelPanelData } from "../../../server/services/hotelPanel";

// API layer: thin wrapper that handles the HTTP request/response
// and delegates business logic to the service layer.
export async function GET() {
  const panelData = await getHotelPanelData();
  return NextResponse.json({ data: panelData });
}
