"use client";

import React from "react";
import Link from "next/link";
import { AppButton } from "./AppButton";

export default function RegisterForm() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf3fb_45%,#e6eef9_100%)] text-slate-900">
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-4">
            <Link href="/">
              <AppButton variant="ghost" size="sm" className="border-slate-200 text-slate-700">
                ← Back to home
              </AppButton>
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-blue-950 mb-2">Create your account</h1>
          <p className="text-sm text-slate-500 mb-6">Register with your email and password.</p>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                required
                placeholder="Enter password"
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Repeat password</label>
              <input
                type="password"
                required
                placeholder="Repeat password"
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </div>

            <AppButton type="submit" variant="primary" size="lg" className="w-full">
              Create account
            </AppButton>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
