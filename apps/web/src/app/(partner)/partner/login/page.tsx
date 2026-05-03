"use client";

import React from "react";
import Link from "next/link";
import { AppButton } from "../../../../components/app-button";

export default function PartnerLoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-emerald-700 text-white flex items-center justify-center">
      <div className="mx-auto w-full max-w-md px-6 py-12">
        <div className="rounded-2xl bg-white/6 p-8 backdrop-blur-sm border border-white/10 shadow-2xl">
          <div className="mb-4">
            <Link href="/partner">
              <AppButton variant="ghost" size="sm" className="border-white/20 text-white/90">
                ← Back to hosts
              </AppButton>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">Host sign in</h1>
          <p className="text-sm text-white/80 mb-6">Sign in to manage your listings and bookings.</p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Email</label>
              <input type="email" required placeholder="host@hotel.com" className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white/90"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
              <input type="password" required placeholder="Password" className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white/90"/>
            </div>
            <AppButton type="submit" variant="primary" size="lg" className="w-full bg-amber-400 text-slate-900">Sign in</AppButton>
          </form>
          <p className="mt-4 text-sm text-white/80">Not a host? <Link href="/partner/register" className="text-amber-300 font-semibold">Create host account</Link></p>
        </div>
      </div>
    </main>
  );
}
