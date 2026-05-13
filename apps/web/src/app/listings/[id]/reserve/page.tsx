import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { getListingById } from "@/server/services/hotelPanel";
import ReservationFormClient from "./ReservationFormClient";
import type { ListingDetails } from "@/types/hotel-panel";

interface Props {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function ReservePage({ params }: Props) {
  const resolvedParams = (await params) as { id: string };

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const listing: ListingDetails | null = await getListingById(resolvedParams.id);
  if (!listing) return notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <ReservationFormClient listing={listing} />
    </main>
  );
}
