"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppButton } from "./AppButton";
import { sanitizeCallbackUrl } from "@/lib/auth/role-routing";

const inputClass =
  "w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/45 focus:border-amber-300";
const labelClass = "block text-sm font-medium text-white/90 mb-2";

function getLoginErrorMessage(error: string) {
  const decodedError = decodeURIComponent(error);
  if (decodedError === "CredentialsSignin") return "Invalid email or password.";
  return decodedError;
}

function getCurrentCallbackUrl() {
  const params = new URLSearchParams(window.location.search);
  return sanitizeCallbackUrl(params.get("callbackUrl"), "partner");
}

export default function PartnerLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const callbackUrl = getCurrentCallbackUrl();
    const result = await signIn("credentials", {
      email,
      password,
      loginContext: "partner",
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError(getLoginErrorMessage(result.error));
      setIsSubmitting(false);
      return;
    }

    router.push(result?.url ?? callbackUrl);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-emerald-700 text-white flex items-center justify-center">
      <div className="mx-auto w-full max-w-md px-6 py-12">
        <div className="rounded-2xl bg-white/6 p-8 backdrop-blur-sm border border-white/10 shadow-2xl">
          <div className="mb-4">
            <Link href="/partner">
              <AppButton variant="ghost" size="sm" className="border-white/20 text-white/90">
                Back to partners
              </AppButton>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">Partner sign in</h1>
          <p className="text-sm text-white/80 mb-6">
            Access your portfolio workspace to manage hotels, bookings, and guest feedback.
          </p>
          <form name="partner-login-form" onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <label htmlFor="partnerEmail">
              <span className={labelClass}>Email</span>
              <input
                id="partnerEmail"
                name="partnerEmail"
                type="email"
                required
                placeholder="partners@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="section-partner username"
                className={inputClass}
              />
            </label>
            <label htmlFor="partnerPassword">
              <span className={labelClass}>Password</span>
              <input
                id="partnerPassword"
                name="partnerPassword"
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="section-partner current-password"
                className={inputClass}
              />
            </label>

            {error ? (
              <p className="rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            ) : null}

            <AppButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full bg-amber-400 text-slate-900"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </AppButton>
          </form>
          <p className="mt-4 text-sm text-white/80">
            New business partner?{" "}
            <Link href="/partner/register" className="text-amber-300 font-semibold">
              Create partner account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
