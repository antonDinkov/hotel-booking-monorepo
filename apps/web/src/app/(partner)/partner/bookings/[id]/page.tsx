import { notFound, redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { getPartnerBookingDetails } from "@/server/services/partnerBookings";
import type { PartnerBookingPageProps } from "@/types/partner";
import PartnerBookingDetailClient from "./PartnerBookingDetailClient";

function parseBookingId(value: string): number {
  const bookingId = Number(value);
  if (!Number.isInteger(bookingId) || bookingId < 1) notFound();
  return bookingId;
}

export default async function Page({ params }: PartnerBookingPageProps) {
  const auth = await authorize(["partner"]);
  if (!auth.ok || !auth.userId) redirect("/partner/login");

  const { id } = await params;
  const booking = await getPartnerBookingDetails(auth.userId, parseBookingId(id));
  if (!booking) notFound();

  return <PartnerBookingDetailClient booking={booking} />;
}
