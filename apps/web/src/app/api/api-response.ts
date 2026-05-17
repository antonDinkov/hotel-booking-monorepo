import { NextResponse } from "next/server";

export function apiError(message: string, code: string, status: number) {
  return NextResponse.json({ error: { message, code } }, { status });
}

export function authError(status?: number) {
  return status === 401
    ? apiError("Unauthorized", "UNAUTHORIZED", 401)
    : apiError("Forbidden", "FORBIDDEN", 403);
}

export function parsePositiveInteger(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
