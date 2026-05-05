import { ListingDetailsCard } from "../../../../components/ListingDetailsCard";
import { getListingById } from "../../../../server/services/hotelPanel";
import type { ListingDetails } from "../../../../types/hotel-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = (await getListingById(id)) as ListingDetails;

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
  const listing = (await getListingById(id)) as ListingDetails;

  return <ListingDetailsCard listing={listing} />;
}
