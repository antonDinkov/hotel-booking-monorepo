"use client";

import {
  Bars3Icon,
  BellAlertIcon,
  ChevronRightIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { adminSystemIndicators } from "@/lib/admin-mock-data";
import AdminSearchBar from "./AdminSearchBar";
import AdminStatusBadge from "./AdminStatusBadge";
import type { AdminTopbarProps } from "@/types/admin";

function formatSegment(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean).slice(1);
  return segments.map((segment, index) => ({
    label: formatSegment(segment),
    href: `/admin/${segments.slice(0, index + 1).join("/")}`,
  }));
}

export default function AdminTopbar({ pathname, onMenuClick }: AdminTopbarProps) {
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0b0f14]">
      <div className="flex min-h-14 flex-col gap-3 px-4 py-3 lg:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="border border-slate-800 p-2 text-slate-300 lg:hidden"
              aria-label="Open admin navigation"
            >
              <Bars3Icon className="h-4 w-4" aria-hidden="true" />
            </button>
            <nav className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
              <Link href="/admin/dashboard" className="font-semibold text-slate-300">
                Admin
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.href} className="flex min-w-0 items-center gap-1">
                  <ChevronRightIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {index === breadcrumbs.length - 1 ? (
                    <span className="truncate text-slate-400">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="truncate hover:text-slate-200">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin/reports"
              className="hidden items-center gap-2 border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/15 sm:inline-flex"
            >
              <BellAlertIcon className="h-4 w-4" aria-hidden="true" />
              11 critical
            </Link>
            <Link
              href="/admin/system"
              className="inline-flex items-center gap-2 border border-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-700"
            >
              <CommandLineIcon className="h-4 w-4" aria-hidden="true" />
              Ops
            </Link>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(280px,520px)_1fr] xl:items-center">
          <AdminSearchBar compact />
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {adminSystemIndicators.map((indicator) => (
              <div
                key={indicator.label}
                className="flex items-center gap-1.5 border border-slate-800 bg-slate-950 px-2 py-1"
              >
                <span className="text-[11px] uppercase tracking-wide text-slate-600">
                  {indicator.label}
                </span>
                <AdminStatusBadge label={indicator.value} tone={indicator.tone} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
