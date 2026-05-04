"use client";

import Link from "next/link";
import { AppButton } from "./app-button";
import type { Navigation } from "../types/hotel-panel";
import { BuildingStorefrontIcon } from "@heroicons/react/24/solid";

function BrandMark() {
  return <BuildingStorefrontIcon className="h-7 w-7 text-blue-700" />;
}

interface HeaderNavigationProps {
  brandName: string;
  navigation: Navigation;
  // Session is a UI-only prop. It may be null for guests.
  session: { user?: { email?: string | null; name?: string | null } } | null;
}

export function HeaderNavigation({
  brandName,
  navigation,
  session = null,
}: HeaderNavigationProps) {
  const isLoggedIn = Boolean(session);
  const userEmail = session?.user?.email ?? session?.user?.name ?? null;
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2.5 text-[1.15rem] font-extrabold tracking-tight text-blue-950">
          <BrandMark />
          {brandName}
        </Link>
        {!isLoggedIn ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login">
              <AppButton variant="primary" size="md">
                Login
              </AppButton>
            </Link>

            <Link href="/register">
              <AppButton
                variant="secondary"
                size="md"
                className="border-blue-700 text-blue-700 hover:border-blue-800 hover:bg-blue-50"
              >
                Register
              </AppButton>
            </Link>

            <Link href="/partner/login">
              <AppButton variant="secondary" size="md" className="border-slate-200 hover:border-slate-300">
                For Hosts
              </AppButton>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            {userEmail ? (
              <p className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 sm:block">
                {userEmail}
              </p>
            ) : null}

            <Link href="/dashboard">
              <AppButton variant="secondary" size="md" className="border-slate-200 hover:border-slate-300">
                Dashboard
              </AppButton>
            </Link>

            <Link href="/bookings">
              <AppButton variant="secondary" size="md" className="border-slate-200 hover:border-slate-300">
                My Bookings
              </AppButton>
            </Link>

            <Link href="/profile">
              <AppButton variant="secondary" size="md" className="border-slate-200 hover:border-slate-300">
                Profile
              </AppButton>
            </Link>

            <AppButton variant="primary" size="md">
              Logout
            </AppButton>
          </div>
        )}
      </div>
    </header>
  );
}