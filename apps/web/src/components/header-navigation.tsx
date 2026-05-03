"use client";

import { AppButton } from "./app-button";
import type { Navigation } from "../types/hotel-panel";
import { BuildingStorefrontIcon } from "@heroicons/react/24/solid";

function BrandMark() {
  return <BuildingStorefrontIcon className="h-7 w-7 text-blue-700" />;
}

interface HeaderNavigationProps {
  brandName: string;
  navigation: Navigation;
  isLoggedIn: boolean;
  userName?: string;
}

export function HeaderNavigation({
  brandName,
  navigation,
  isLoggedIn,
  userName = "Traveler",
}: HeaderNavigationProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5 text-[1.15rem] font-extrabold tracking-tight text-blue-950">
          <BrandMark />
          {brandName}
        </a>

        {!isLoggedIn ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <AppButton
              variant="secondary"
              size="md"
              className="border-blue-700 text-blue-700 hover:border-blue-800 hover:bg-blue-50"
            >
              Sign Up
            </AppButton>
            <AppButton variant="primary" size="md">
              {navigation.primaryAction}
            </AppButton>
            <AppButton variant="secondary" size="md" className="border-slate-200 hover:border-slate-300">
              {navigation.secondaryAction}
            </AppButton>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <p className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 sm:block">
              Hi, {userName}
            </p>
            <AppButton variant="secondary" size="md" className="border-slate-200 hover:border-slate-300">
              My Trips
            </AppButton>
            <AppButton variant="primary" size="md">
              Logout
            </AppButton>
          </div>
        )}
      </div>
    </header>
  );
}