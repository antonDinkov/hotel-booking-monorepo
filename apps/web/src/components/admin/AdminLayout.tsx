"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import type { AdminRouteLayoutProps } from "@/types/admin";

const plainAdminRoutes = new Set(["/admin/login"]);

export default function AdminLayout({ children }: AdminRouteLayoutProps) {
  const pathname = usePathname() ?? "/admin/dashboard";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (plainAdminRoutes.has(pathname)) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-200">
      <div className="hidden min-h-screen lg:fixed lg:inset-y-0 lg:flex">
        <AdminSidebar pathname={pathname} />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close admin navigation"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex h-full w-72 max-w-[86vw] flex-col bg-[#090d12] shadow-2xl">
            <div className="flex justify-end border-b border-slate-800 p-2">
              <button
                type="button"
                className="border border-slate-800 p-2 text-slate-300"
                aria-label="Close admin navigation"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <AdminSidebar pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="min-h-screen lg:pl-64">
        <AdminTopbar pathname={pathname} onMenuClick={() => setSidebarOpen(true)} />
        <main className="px-4 py-5 lg:px-5">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
