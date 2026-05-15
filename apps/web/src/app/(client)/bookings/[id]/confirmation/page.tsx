import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { getBookingConfirmation } from "@/server/services/bookings";
import BookingConfirmationClient from "./BookingConfirmationClient";

interface Props {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: { stripe?: string; session_id?: string } | Promise<{ stripe?: string; session_id?: string }>;
}

export default async function BookingConfirmationPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const resolvedParams = (await params) as { id: string };
  const resolvedSearchParams = (await searchParams) ?? {};
  const bookingId = Number(resolvedParams.id);
  if (Number.isNaN(bookingId)) {
    notFound();
  }

  const confirmation = await getBookingConfirmation(bookingId, session.user.id as string);
  if (!confirmation) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <BookingConfirmationClient
        confirmation={confirmation}
        stripeStatus={resolvedSearchParams.stripe}
        stripeSessionId={resolvedSearchParams.session_id}
      />
    </main>
  );
}
