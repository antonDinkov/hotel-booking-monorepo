"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppButton } from "@/components/AppButton";

export default function ReservationConfirmedClient({ listingId }: { listingId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkIn = searchParams?.get("checkIn") ?? "";
  const checkOut = searchParams?.get("checkOut") ?? "";
  const guests = searchParams?.get("guests") ?? "1";

  const [count, setCount] = useState(5);

  useEffect(() => {
    const t = setInterval(() => setCount((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (count <= 0) {
      router.push("/dashboard");
    }
  }, [count, router]);

  return (
    <div className="mx-auto max-w-xl p-6 bg-white rounded-xl shadow text-center">
      <h1 className="text-2xl font-semibold mb-2">Reservation Confirmed</h1>
      <p className="text-slate-600 mb-4">Your reservation for listing {listingId} is confirmed.</p>
      {checkIn && checkOut && (
        <p className="mb-2">Dates: {checkIn} → {checkOut}</p>
      )}
      <p className="mb-4">Guests: {guests}</p>
      <p className="mb-4">Redirecting to dashboard in {count} second{count === 1 ? "" : "s"}...</p>

      <div className="flex justify-center gap-3">
        <AppButton variant="secondary" size="md" onClick={() => router.push("/dashboard")}>
          Go Now
        </AppButton>
        <AppButton variant="ghost" size="md" onClick={() => router.push(`/listings/${listingId}`)}>
          Back to listing
        </AppButton>
      </div>
    </div>
  );
}
