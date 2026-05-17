"use client";

import {
  ArrowRightIcon,
  LockClosedIcon,
  ServerStackIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { sanitizeCallbackUrl } from "@/lib/auth/role-routing";

function getLoginErrorMessage(error: string) {
  const decodedError = decodeURIComponent(error);
  if (decodedError === "CredentialsSignin" || decodedError === "AccessDenied") {
    return "Invalid email or password.";
  }

  return decodedError;
}

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? getLoginErrorMessage(searchParams.get("error") as string) : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"), "admin");
    const result = await signIn("credentials", {
      email,
      password,
      loginContext: "admin",
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
    <main className="min-h-screen bg-[#070a0f] text-slate-200">
      <div className="grid min-h-screen lg:grid-cols-[minmax(320px,460px)_1fr]">
        <section className="border-r border-slate-800 bg-[#090d12] px-6 py-8 sm:px-10">
          <div className="flex h-full flex-col">
            <Link href="/admin/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
              <ServerStackIcon className="h-5 w-5 text-blue-300" aria-hidden="true" />
              Admin Operations
            </Link>

            <div className="my-auto max-w-sm">
              <div className="mb-5 inline-flex border border-slate-800 bg-slate-950 p-2 text-slate-400">
                <LockClosedIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-50">
                Admin sign in
              </h1>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Access is restricted to administrator accounts only. Client and partner credentials are rejected here.
              </p>

              <form
                name="admin-login-form"
                onSubmit={handleSubmit}
                className="mt-6 space-y-4"
                autoComplete="on"
              >
                <label className="block" htmlFor="adminEmail">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Admin email
                  </span>
                  <input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="section-admin username"
                    className="mt-1 h-10 w-full rounded-[4px] border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60"
                  />
                </label>
                <label className="block" htmlFor="adminPassword">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Password
                  </span>
                  <input
                    id="adminPassword"
                    name="adminPassword"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="section-admin current-password"
                    className="mt-1 h-10 w-full rounded-[4px] border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60"
                  />
                </label>

                {error ? (
                  <p className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[4px] bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-70"
                >
                  {isSubmitting ? "Signing in..." : "Continue to dashboard"}
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </div>

            <div className="border border-slate-800 bg-slate-950 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Access policy
              </p>
              <p className="mt-2 text-xs text-slate-500">
                No self-service registration. Admin access is issued from the shared user system.
              </p>
            </div>
          </div>
        </section>

        <section className="hidden px-10 py-8 lg:block">
          <div className="grid h-full grid-rows-[auto_1fr_auto] border border-slate-800 bg-slate-950">
            <div className="border-b border-slate-800 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Operations perimeter
              </p>
            </div>
            <div className="grid place-items-center px-8">
              <div className="w-full max-w-2xl">
                <div className="grid grid-cols-3 border border-slate-800 text-xs">
                  {["Identity", "Moderation", "Payments"].map((item) => (
                    <div key={item} className="border-r border-slate-800 p-4 last:border-r-0">
                      <p className="font-semibold text-slate-200">{item}</p>
                      <p className="mt-2 leading-5 text-slate-500">
                        Admin access stays separated from client and partner flows.
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border border-slate-800 bg-[#0b0f14] p-4">
                  <p className="text-xs text-slate-500">
                    This screen intentionally keeps the strict admin visual language:
                    compact spacing, hard borders, no register flow, and no client-facing copy.
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-800 px-5 py-3 text-xs text-slate-600">
              Admin Console / Auth.js credentials / May 2026
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
