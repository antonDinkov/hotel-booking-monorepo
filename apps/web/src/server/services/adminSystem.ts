import "server-only";

import { sql } from "drizzle-orm";
import nextPackage from "next/package.json";

import { db } from "@/db";
import type {
  AdminSystemCheck,
  AdminSystemConfigurationItem,
  AdminSystemPaymentHealth,
  AdminSystemResult,
  AdminSystemRuntimeInfo,
  AdminSystemSummaryCard,
} from "@/types/admin-system";

const NEXT_VERSION = String(nextPackage.version);
const STRIPE_KEYS = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const;
const R2_KEYS = [
  "R2_ENDPOINT",
  "R2_BUCKET_NAME",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
] as const;
const OPTIONAL_R2_KEYS = ["R2_PUBLIC_URL", "NEXT_PUBLIC_R2_PUBLIC_URL"] as const;

function isConfigured(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

function configuredCount(keys: readonly string[]): number {
  return keys.filter((key) => isConfigured(key)).length;
}

function timestamp(): string {
  return new Date().toISOString();
}

function card(
  label: string,
  value: string,
  detail: string,
  tone: AdminSystemSummaryCard["tone"]
): AdminSystemSummaryCard {
  return { label, value, detail, tone };
}

function check(
  name: string,
  status: string,
  detail: string,
  tone: AdminSystemCheck["tone"],
  updatedAt: string
): AdminSystemCheck {
  return { name, status, detail, tone, updatedAt };
}

async function checkDatabase(updatedAt: string): Promise<AdminSystemCheck> {
  try {
    await db.execute(sql`select 1 as ok`);
    return check("Database", "connected", "Database responded to a safe connectivity check.", "blue", updatedAt);
  } catch (error) {
    console.error("Admin system database health check failed:", error);
    return check("Database", "unavailable", "Database connectivity check failed.", "red", updatedAt);
  }
}

function configurationItem(key: string, label: string): AdminSystemConfigurationItem {
  const configured = isConfigured(key);
  return {
    key,
    label,
    configured,
    detail: configured ? "Configured" : "Missing",
    tone: configured ? "blue" : "red",
  };
}

function getConfiguration(): AdminSystemConfigurationItem[] {
  return [
    configurationItem("DATABASE_URL", "Database URL"),
    ...STRIPE_KEYS.map((key) => configurationItem(key, key)),
    ...R2_KEYS.map((key) => configurationItem(key, key)),
    {
      key: "R2_PUBLIC_URL",
      label: "R2 public URL",
      configured: OPTIONAL_R2_KEYS.some((key) => isConfigured(key)),
      detail: OPTIONAL_R2_KEYS.some((key) => isConfigured(key)) ? "Configured" : "Optional public URL missing",
      tone: OPTIONAL_R2_KEYS.some((key) => isConfigured(key)) ? "blue" : "amber",
    },
  ];
}

async function getPaymentHealth(): Promise<AdminSystemPaymentHealth> {
  const result = await db.execute<Record<string, unknown>>(sql`
    select
      count(*) filter (where payment_method = 'stripe')::int as stripe_bookings,
      count(*) filter (where payment_method = 'stripe' and payment_status = 'paid')::int as paid_stripe_bookings,
      count(*) filter (
        where payment_method = 'stripe'
          and payment_status = 'paid'
          and stripe_payment_intent_id is null
      )::int as stripe_bookings_missing_payment_intent,
      count(*) filter (where payment_status = 'refund_pending')::int as refund_pending,
      max(created_at) filter (where payment_method = 'stripe') as latest_stripe_booking_at
    from bookings
  `);
  const row = result.rows[0] ?? {};
  const latest = row.latest_stripe_booking_at;

  return {
    stripeBookings: Number(row.stripe_bookings ?? 0),
    paidStripeBookings: Number(row.paid_stripe_bookings ?? 0),
    stripeBookingsMissingPaymentIntent: Number(row.stripe_bookings_missing_payment_intent ?? 0),
    refundPending: Number(row.refund_pending ?? 0),
    latestStripeBookingAt: latest ? new Date(String(latest)).toISOString() : null,
  };
}

async function safePaymentHealth(): Promise<AdminSystemPaymentHealth> {
  try {
    return await getPaymentHealth();
  } catch (error) {
    console.error("Admin system payment health check failed:", error);
    return {
      stripeBookings: 0,
      paidStripeBookings: 0,
      stripeBookingsMissingPaymentIntent: 0,
      refundPending: 0,
      latestStripeBookingAt: null,
    };
  }
}

function getRuntimeInfo(generatedAt: string): AdminSystemRuntimeInfo {
  return {
    environment: process.env.NODE_ENV ?? "unknown",
    nodeVersion: process.version,
    nextVersion: NEXT_VERSION,
    generatedAt,
  };
}

function getCards(
  dbCheck: AdminSystemCheck,
  paymentHealth: AdminSystemPaymentHealth
): AdminSystemSummaryCard[] {
  const stripeCount = configuredCount(STRIPE_KEYS);
  const r2Count = configuredCount(R2_KEYS);

  return [
    card("Database", dbCheck.status, dbCheck.detail, dbCheck.tone),
    card("Stripe", `${stripeCount}/${STRIPE_KEYS.length}`, "Required Stripe environment variables configured.", stripeCount === STRIPE_KEYS.length ? "blue" : "red"),
    card("R2 storage", `${r2Count}/${R2_KEYS.length}`, "Required Cloudflare R2 environment variables configured.", r2Count === R2_KEYS.length ? "blue" : "red"),
    card("Payment health", `${paymentHealth.refundPending} pending`, "Stripe refund queue derived from booking payment fields.", paymentHealth.refundPending ? "amber" : "blue"),
  ];
}

export async function getAdminSystemStatus(): Promise<AdminSystemResult> {
  const generatedAt = timestamp();
  const [dbCheck, paymentHealth] = await Promise.all([
    checkDatabase(generatedAt),
    safePaymentHealth(),
  ]);
  const stripeCount = configuredCount(STRIPE_KEYS);
  const r2Count = configuredCount(R2_KEYS);
  const checks = [
    dbCheck,
    check("Stripe configuration", stripeCount === STRIPE_KEYS.length ? "configured" : "missing", `${stripeCount} of ${STRIPE_KEYS.length} required values configured.`, stripeCount === STRIPE_KEYS.length ? "blue" : "red", generatedAt),
    check("Cloudflare R2 configuration", r2Count === R2_KEYS.length ? "configured" : "missing", `${r2Count} of ${R2_KEYS.length} required values configured.`, r2Count === R2_KEYS.length ? "blue" : "red", generatedAt),
    check("Runtime", process.env.NODE_ENV ?? "unknown", `Node ${process.version} / Next.js ${NEXT_VERSION}`, "neutral", generatedAt),
    check("Stripe booking references", paymentHealth.stripeBookingsMissingPaymentIntent ? "review" : "healthy", `${paymentHealth.stripeBookingsMissingPaymentIntent} paid Stripe bookings missing payment intent IDs.`, paymentHealth.stripeBookingsMissingPaymentIntent ? "amber" : "blue", generatedAt),
  ];

  return {
    generatedAt,
    cards: getCards(dbCheck, paymentHealth),
    checks,
    configuration: getConfiguration(),
    paymentHealth,
    runtime: getRuntimeInfo(generatedAt),
  };
}
