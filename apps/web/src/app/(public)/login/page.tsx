"use client";

import React from "react";
import Link from "next/link";
import { HeaderNavigation } from "../../../components/header-navigation";
import { AppButton } from "../../../components/app-button";
import { FaGithub } from "react-icons/fa";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf3fb_45%,#e6eef9_100%)] text-slate-900">
      <HeaderNavigation
        brandName="BookYourStay"
        navigation={{ primaryAction: "Sign In", secondaryAction: "For Hosts" }}
        isLoggedIn={false}
      />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-4">
            <Link href="/">
              <AppButton variant="ghost" size="sm" className="border-slate-200 text-slate-700">
                ← Back to home
              </AppButton>
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-blue-950 mb-2">Sign in to your account</h1>
          <p className="text-sm text-slate-500 mb-6">Use your email and password, or sign in with Google.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              <AppButton type="submit" variant="primary" size="lg" className="w-full">
                Sign in
              </AppButton>

              <p className="mt-4 text-sm text-slate-600">
                Don't have an account?{' '}
                <Link href="/register" className="text-blue-700 font-semibold">
                  Create one
                </Link>
              </p>
            </form>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs text-center">
                <p className="text-sm font-medium text-slate-700 mb-4">Or sign in with</p>
                <AppButton
                  variant="ghost"
                  size="lg"
                  className="w-full border-slate-200"
                  leftIcon={<FaGithub className="h-5 w-5" />}
                >
                  GitHub
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
