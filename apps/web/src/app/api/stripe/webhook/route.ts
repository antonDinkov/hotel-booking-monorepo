import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/server/lib/stripe";
import { handleStripeCheckoutCompleted } from "@/server/services/bookings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function apiError(message: string, code: string, status: number) {
  return NextResponse.json({ error: { message, code } }, { status });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return apiError("Missing Stripe signature", "MISSING_STRIPE_SIGNATURE", 400);
  }

  if (!webhookSecret) {
    return apiError("Stripe webhook is not configured", "STRIPE_WEBHOOK_SECRET_MISSING", 500);
  }

  let event: Stripe.Event;
  const rawBody = await request.text();

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return apiError("Invalid Stripe signature", "INVALID_STRIPE_SIGNATURE", 400);
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleStripeCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }

    return NextResponse.json({ data: { received: true } });
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    return apiError("Failed to handle Stripe webhook", "STRIPE_WEBHOOK_FAILED", 500);
  }
}
