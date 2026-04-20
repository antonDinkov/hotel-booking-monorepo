import { headers } from "next/headers";
import type { HotelPanelData } from "../types/hotel-panel";

export async function getPanelData(): Promise<HotelPanelData> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Unable to resolve request host for hotel panel API fetch.");
  }

  const response = await fetch(`${protocol}://${host}/api/hotel-panel`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load hotel panel data.");
  }

  return response.json() as Promise<HotelPanelData>;
}