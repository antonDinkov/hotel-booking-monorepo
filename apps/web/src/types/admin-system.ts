import type { AdminBadgeTone } from "@/types/admin";

export type AdminSystemSummaryCard = {
  label: string;
  value: string;
  detail: string;
  tone: AdminBadgeTone;
};

export type AdminSystemCheck = {
  name: string;
  status: string;
  detail: string;
  updatedAt: string;
  tone: AdminBadgeTone;
};

export type AdminSystemConfigurationItem = {
  key: string;
  label: string;
  configured: boolean;
  detail: string;
  tone: AdminBadgeTone;
};

export type AdminSystemPaymentHealth = {
  stripeBookings: number;
  paidStripeBookings: number;
  stripeBookingsMissingPaymentIntent: number;
  refundPending: number;
  latestStripeBookingAt: string | null;
};

export type AdminSystemRuntimeInfo = {
  environment: string;
  nodeVersion: string;
  nextVersion: string;
  generatedAt: string;
};

export type AdminSystemResult = {
  generatedAt: string;
  cards: AdminSystemSummaryCard[];
  checks: AdminSystemCheck[];
  configuration: AdminSystemConfigurationItem[];
  paymentHealth: AdminSystemPaymentHealth;
  runtime: AdminSystemRuntimeInfo;
};
