import { NextResponse } from "next/server";
import panelData from "../../../mock/hotel-panel";

export async function GET() {
  return NextResponse.json(panelData);
}