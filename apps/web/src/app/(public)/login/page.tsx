"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { FaGithub } from "react-icons/fa";
import { AppButton } from "../../../components/app-button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setIsSubmitting(false);
      return;
    }

    window.location.assign(result?.url ?? "/dashboard");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf3fb_45%,#e6eef9_100%)] text-slate-900">
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
          <p className="text-sm text-slate-500 mb-6">Use your email and password to access your account.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                />
              </div>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <AppButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </AppButton>

              <p className="mt-4 text-sm text-slate-600">
                Do not have an account?{" "}
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
                  onClick={() => void signIn("github")}
                  type="button"
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
