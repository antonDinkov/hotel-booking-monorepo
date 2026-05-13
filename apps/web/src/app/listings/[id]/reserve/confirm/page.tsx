import ReservationConfirmedClient from "../ReservationConfirmedClient";

interface Props {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function ConfirmPage({ params }: Props) {
  const resolvedParams = (await params) as { id: string };

  return <ReservationConfirmedClient listingId={resolvedParams.id} />;
}
