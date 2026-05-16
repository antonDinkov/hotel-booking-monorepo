"use client";

import {
  Bars3Icon,
  BellIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { PartnerRouteLayoutProps } from "@/types/partner";

const plainPartnerRoutes = new Set([
  "/partner",
  "/partner/login",
  "/partner/register",
]);

const navigationItems = [
  {
    label: "Dashboard",
    href: "/partner/dashboard",
    icon: HomeIcon,
    activePrefixes: ["/partner/dashboard"],
  },
  {
    label: "Hotels",
    href: "/partner/hotels",
    icon: BuildingOffice2Icon,
    activePrefixes: ["/partner/hotels", "/partner/rooms"],
  },
  {
    label: "Bookings",
    href: "/partner/bookings",
    icon: ClipboardDocumentListIcon,
    activePrefixes: ["/partner/bookings"],
  },
  {
    label: "Reviews",
    href: "/partner/reviews",
    icon: ChatBubbleLeftRightIcon,
    activePrefixes: ["/partner/reviews"],
  },
  {
    label: "Analytics",
    href: "/partner/analytics",
    icon: ChartBarIcon,
    activePrefixes: ["/partner/analytics"],
  },
  {
    label: "Calendar",
    href: "/partner/calendar",
    icon: CalendarDaysIcon,
    activePrefixes: ["/partner/calendar"],
  },
  {
    label: "Notifications",
    href: "/partner/notifications",
    icon: BellIcon,
    activePrefixes: ["/partner/notifications"],
  },
  {
    label: "Settings",
    href: "/partner/settings",
    icon: Cog6ToothIcon,
    activePrefixes: ["/partner/settings"],
  },
];

function isActiveRoute(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function PartnerLayout({ children }: PartnerRouteLayoutProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (plainPartnerRoutes.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.22),transparent_34%),linear-gradient(135deg,#020617_0%,#111827_42%,#064e3b_100%)]" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/70 px-4 py-5 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="px-3">
            <Link href="/partner/dashboard" className="group block">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
                BookYourStay
              </p>
              <p className="mt-2 text-xl font-semibold text-white">Partner Console</p>
            </Link>
          </div>
          <nav className="mt-8 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(pathname, item.activePrefixes);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-white/10 text-white shadow-lg shadow-indigo-950/30 ring-1 ring-white/10"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
            <p className="text-sm font-semibold text-emerald-100">Portfolio health</p>
            <p className="mt-2 text-xs leading-5 text-emerald-50/75">
              92% of listings are ready for peak-season demand.
            </p>
          </div>
        </aside>

        {menuOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/70"
              aria-label="Close partner navigation"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col border-r border-white/10 bg-slate-950 px-4 py-5 shadow-2xl">
              <div className="flex items-center justify-between px-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
                    BookYourStay
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">Partner Console</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-white/10 p-2 text-slate-200"
                  aria-label="Close partner navigation"
                  onClick={() => setMenuOpen(false)}
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <nav className="mt-8 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveRoute(pathname, item.activePrefixes);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "bg-white/10 text-white ring-1 ring-white/10"
                          : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-white/10 p-2 text-slate-200 lg:hidden"
                  aria-label="Open partner navigation"
                  onClick={() => setMenuOpen(true)}
                >
                  <Bars3Icon className="h-5 w-5" aria-hidden="true" />
                </button>
                <div>
                  <p className="text-xs text-slate-500">Partner workspace</p>
                  <p className="text-sm font-semibold text-slate-100">Hotel portfolio</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="hidden rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] sm:inline-flex"
                >
                  Public site
                </Link>
                <Link
                  href="/partner/notifications"
                  className="rounded-lg border border-white/10 p-2 text-slate-200 transition hover:bg-white/[0.06]"
                  aria-label="Open notifications"
                >
                  <BellIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  href="/partner/settings"
                  className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15"
                >
                  Settings
                </Link>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
