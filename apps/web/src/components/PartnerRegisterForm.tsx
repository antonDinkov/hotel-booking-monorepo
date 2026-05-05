"use client";

import React from "react";
import Link from "next/link";
import { AppButton } from "./AppButton";

export default function PartnerRegisterForm() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-emerald-700 text-white flex items-center justify-center">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="rounded-2xl bg-white/6 p-8 backdrop-blur-sm border border-white/10 shadow-2xl">
          <div className="mb-4">
            <Link href="/partner">
              <AppButton variant="ghost" size="sm" className="border-white/20 text-white/90">
                ← Back to hosts
              </AppButton>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">Become a Host</h1>
          <p className="text-sm text-white/80 mb-6">Create your host account and add your property.</p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Company name</label>
                <input type="text" required placeholder="Company LLC" className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white/90"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Hotel name</label>
                <input type="text" required placeholder="Hotel Sunshine" className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white/90"/>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Representative - First name</label>
                <input type="text" required placeholder="First name" className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white/90"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Representative - Family name</label>
                <input type="text" required placeholder="Last name" className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white/90"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Position</label>
                <input type="text" required placeholder="Manager" className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white/90"/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Email</label>
              <input type="email" required placeholder="host@hotel.com" className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white/90"/>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
                <input type="password" required placeholder="Password" className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white/90"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Repeat password</label>
                <input type="password" required placeholder="Repeat password" className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white/90"/>
              </div>
            </div>

            <AppButton type="submit" variant="primary" size="lg" className="w-full bg-amber-400 text-slate-900">Create host account</AppButton>
          </form>

          <p className="mt-4 text-sm text-white/80">Already a host? <Link href="/partner/login" className="text-amber-300 font-semibold">Sign in</Link></p>
        </div>
      </div>
    </main>
  );
}
