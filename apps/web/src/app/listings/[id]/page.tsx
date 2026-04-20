import { headers } from "next/headers";
import { ListingDetailsCard } from "../../../components/listing-details-card";
import type { ListingDetails } from "../../../types/hotel-panel";

async function getListingById(id: string): Promise<ListingDetails> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Unable to resolve request host for API fetch.");
  }

  const response = await fetch(`${protocol}://${host}/api/listings/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load listing details for ID: ${id}`);
  }

  return response.json() as Promise<ListingDetails>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListingById(id);

  return {
    title: `${listing.name} | BookYourStay`,
    description: listing.description.slice(0, 160),
  };
}

export default async function ListingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListingById(id);

  return <ListingDetailsCard listing={listing} />;
}
