"use client";

import React from "react";
import Link from "next/link";
import { AppButton } from "../../../components/AppButton";

export default function PartnerWelcomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-emerald-700 text-white flex items-center justify-center">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <div className="mb-6">
          <Link href="/">
            <AppButton variant="ghost" size="sm" className="border-white/20 text-white/90">
              ← Back to public view
            </AppButton>
          </Link>
        </div>
        <div className="rounded-3xl bg-white/6 p-12 backdrop-blur-sm border border-white/10 shadow-2xl">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">Welcome, Hosts</h1>
          <p className="mb-8 text-lg text-white/90 max-w-2xl">
            Join BookYourStay to welcome travelers from around the world. Manage your listings, set flexible pricing, and offer unforgettable stays.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/partner/login" className="w-full sm:w-auto">
              <AppButton
                variant="ghost"
                size="lg"
                className="w-full border-white/30 text-white/90 px-6 py-4"
              >
                Already a host
              </AppButton>
            </Link>

            <Link href="/partner/register" className="w-full sm:w-auto">
              <AppButton
                variant="primary"
                size="lg"
                className="w-full bg-amber-400 text-slate-900 hover:bg-amber-500 px-6 py-4"
              >
                Become a host
              </AppButton>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
