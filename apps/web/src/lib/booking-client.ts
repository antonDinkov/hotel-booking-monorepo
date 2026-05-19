import type { CreateBookingHoldRequest, CreateBookingHoldResponse } from "@repo/types";

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

export async function createPendingBookingHoldRequest(
  input: CreateBookingHoldRequest
): Promise<CreateBookingHoldResponse> {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => null) as { data?: CreateBookingHoldResponse } & ApiErrorPayload | null;

  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error?.message ?? "Failed to create booking hold.");
  }

  return payload.data;
}
