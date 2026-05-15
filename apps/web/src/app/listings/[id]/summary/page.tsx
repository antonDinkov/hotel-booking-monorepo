import { getServerSession } from "next-auth/next";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getBookingSummary } from "@/server/services/bookings";
import BookingSummaryClient from "./BookingSummaryClient";

interface Props {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: { bookingId?: string; stripe?: string } | Promise<{ bookingId?: string; stripe?: string }>;
}

export default async function SummaryPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const bookingId = Number(resolvedSearchParams.bookingId);
  if (!Number.isInteger(bookingId) || bookingId < 1) {
    notFound();
  }

  const summary = await getBookingSummary(bookingId, session.user.id as string);
  if (!summary || String(summary.hotelId) !== resolvedParams.id) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <BookingSummaryClient
        summary={summary}
        paymentCancelled={resolvedSearchParams.stripe === "cancelled"}
      />
    </main>
  );
}
