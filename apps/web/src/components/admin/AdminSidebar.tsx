"use client";

import {
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ServerStackIcon,
  UsersIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { AdminNavigationItem, AdminSidebarProps } from "@/types/admin";

const navigationItems: AdminNavigationItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: HomeIcon,
    activePrefixes: ["/admin/dashboard"],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: UsersIcon,
    activePrefixes: ["/admin/users"],
  },
  {
    label: "Partners",
    href: "/admin/partners",
    icon: BuildingOfficeIcon,
    activePrefixes: ["/admin/partners"],
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: ClipboardDocumentListIcon,
    activePrefixes: ["/admin/bookings"],
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: ChatBubbleLeftRightIcon,
    activePrefixes: ["/admin/reviews"],
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: ExclamationTriangleIcon,
    activePrefixes: ["/admin/reports"],
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: CreditCardIcon,
    activePrefixes: ["/admin/payments"],
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: ChartBarIcon,
    activePrefixes: ["/admin/analytics"],
  },
  {
    label: "System",
    href: "/admin/system",
    icon: ServerStackIcon,
    activePrefixes: ["/admin/system"],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Cog6ToothIcon,
    activePrefixes: ["/admin/settings"],
  },
];

function isActiveRoute(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function AdminSidebar({ pathname, onNavigate }: AdminSidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-[#090d12]">
      <div className="border-b border-slate-800 px-4 py-4">
        <Link href="/admin/dashboard" onClick={onNavigate} className="block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            BookYourStay
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-100">Admin Operations</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(pathname, item.activePrefixes);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-2 border-l-2 px-3 py-2 text-xs font-semibold transition",
                active
                  ? "border-blue-400 bg-slate-900 text-slate-50"
                  : "border-transparent text-slate-500 hover:border-slate-700 hover:bg-slate-950 hover:text-slate-200",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className="border border-slate-800 bg-slate-950 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Mode
          </p>
          <p className="mt-1 text-xs text-slate-300">Static admin scaffold</p>
        </div>
        <Link
          href="/admin/login"
          onClick={onNavigate}
          className="mt-2 block border border-slate-800 px-3 py-2 text-center text-xs font-semibold text-slate-400 transition hover:border-slate-700 hover:text-slate-100"
        >
          Mock sign out
        </Link>
      </div>
    </aside>
  );
}
