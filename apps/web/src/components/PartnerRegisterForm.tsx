"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppButton } from "./AppButton";
import type {
  PartnerRegistrationInput,
  PartnerRegistrationResult,
} from "@/types/partner-registration";

type PartnerRegistrationFormState = Omit<
  PartnerRegistrationInput,
  "phone" | "website" | "companyAddress" | "vatNumber"
> & {
  phone: string;
  website: string;
  companyAddress: string;
  vatNumber: string;
};

type PartnerRegistrationApiResponse = {
  data?: PartnerRegistrationResult;
  error?: {
    message: string;
    code: string;
  };
};

const initialFormState: PartnerRegistrationFormState = {
  companyName: "",
  representativeFirstName: "",
  representativeLastName: "",
  position: "",
  email: "",
  password: "",
  repeatPassword: "",
  phone: "",
  website: "",
  companyAddress: "",
  vatNumber: "",
};

const inputClass =
  "w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/45 focus:border-amber-300";
const labelClass = "block text-sm font-medium text-white/90 mb-2";

function getLoginErrorMessage(error: string) {
  const decodedError = decodeURIComponent(error);
  if (decodedError === "CredentialsSignin") return "Invalid email or password.";
  return decodedError;
}

export default function PartnerRegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof PartnerRegistrationFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/partner/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json().catch(() => ({})) as PartnerRegistrationApiResponse;

    if (!response.ok || !payload.data) {
      setError(payload.error?.message ?? "Partner registration could not be completed.");
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email: payload.data.email,
      password: form.password,
      loginContext: "partner",
      redirect: false,
      callbackUrl: payload.data.redirectTo,
    });

    if (result?.error) {
      setError(getLoginErrorMessage(result.error));
      setIsSubmitting(false);
      return;
    }

    router.push(result?.url ?? payload.data.redirectTo);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-emerald-700 text-white flex items-center justify-center">
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="rounded-2xl bg-white/6 p-8 backdrop-blur-sm border border-white/10 shadow-2xl">
          <div className="mb-4">
            <Link href="/partner">
              <AppButton variant="ghost" size="sm" className="border-white/20 text-white/90">
                Back to partners
              </AppButton>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">Create partner account</h1>
          <p className="text-sm text-white/80 mb-6">
            Register your business profile now. You can add and manage hotel portfolios after approval.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Company name</span>
                <input
                  type="text"
                  required
                  placeholder="Nusantara Summit Hospitality"
                  value={form.companyName}
                  onChange={(event) => updateField("companyName", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Position</span>
                <input
                  type="text"
                  required
                  placeholder="Managing Director"
                  value={form.position}
                  onChange={(event) => updateField("position", event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label>
                <span className={labelClass}>Representative first name</span>
                <input
                  type="text"
                  required
                  placeholder="Maya"
                  value={form.representativeFirstName}
                  onChange={(event) => updateField("representativeFirstName", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Representative last name</span>
                <input
                  type="text"
                  required
                  placeholder="Santoso"
                  value={form.representativeLastName}
                  onChange={(event) => updateField("representativeLastName", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Phone</span>
                <input
                  type="tel"
                  placeholder="+62 812 5555 0190"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Email</span>
                <input
                  type="email"
                  required
                  placeholder="partners@nusantarasummit.com"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Website</span>
                <input
                  type="url"
                  placeholder="https://www.nusantarasummit.com"
                  value={form.website}
                  onChange={(event) => updateField("website", event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Company address</span>
                <input
                  type="text"
                  placeholder="Jl. Sudirman No. 88, Jakarta"
                  value={form.companyAddress}
                  onChange={(event) => updateField("companyAddress", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>VAT/tax number</span>
                <input
                  type="text"
                  placeholder="NPWP 01.234.567.8-901.000"
                  value={form.vatNumber}
                  onChange={(event) => updateField("vatNumber", event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Password</span>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Repeat password</span>
                <input
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={form.repeatPassword}
                  onChange={(event) => updateField("repeatPassword", event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

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
              {isSubmitting ? "Creating partner account..." : "Create partner account"}
            </AppButton>
          </form>

          <p className="mt-4 text-sm text-white/80">
            Already a partner?{" "}
            <Link href="/partner/login" className="text-amber-300 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
