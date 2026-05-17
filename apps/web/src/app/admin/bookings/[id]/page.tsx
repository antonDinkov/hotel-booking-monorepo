import { notFound, redirect } from "next/navigation";

import AdminBookingDetailClient from "@/components/admin/AdminBookingDetailClient";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { parseAdminBookingId } from "@/lib/admin-booking-validation";
import { getAdminBookingDetails } from "@/server/services/adminBookings";
import type { AdminDetailPageProps } from "@/types/admin";

async function requireAdmin() {
  const auth = await authorize(["admin"]);
  if (!auth.ok) redirect("/admin/login");
}

export default async function Page({ params }: AdminDetailPageProps) {
  await requireAdmin();

  let bookingId: number;
  try {
    bookingId = parseAdminBookingId((await params).id);
  } catch {
    notFound();
  }

  const booking = await getAdminBookingDetails(bookingId);
  if (!booking) notFound();

  return <AdminBookingDetailClient booking={booking} />;
}
