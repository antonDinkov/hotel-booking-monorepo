"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaGithub } from "react-icons/fa";
import { AppButton } from "./AppButton";
import DemoLoginButton from "./DemoLoginButton";
import { sanitizeCallbackUrl } from "@/lib/auth/role-routing";

function getLoginErrorMessage(error: string) {
    const decodedError = decodeURIComponent(error);
    if (decodedError === "CredentialsSignin" || decodedError === "AccessDenied") {
        return "Invalid email or password.";
    }

    return decodedError;
}

export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [demoMessage, setDemoMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(
        searchParams.get("error") ? getLoginErrorMessage(searchParams.get("error") as string) : null
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDemoFill = (demoEmail: string, demoPassword: string) => {
        setEmail(demoEmail);
        setPassword(demoPassword);
        setError(null);
        setDemoMessage("Demo credentials loaded");
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);
        const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"), "client");

        const result = await signIn("credentials", {
            email,
            password,
            loginContext: "client",
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
                        <form name="client-login-form" onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
                            <div>
                                <label htmlFor="clientEmail" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                <input
                                    id="clientEmail"
                                    name="clientEmail"
                                    type="email"
                                    required
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    autoComplete="section-client username"
                                    className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>

                            <div>
                                <label htmlFor="clientPassword" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                                <input
                                    id="clientPassword"
                                    name="clientPassword"
                                    type="password"
                                    required
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    autoComplete="section-client current-password"
                                    className="w-full rounded-md border border-slate-200 px-3 py-2"
                                />
                            </div>

                            {error ? (
                                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {error}
                                </p>
                            ) : null}

                            {demoMessage ? (
                                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700" aria-live="polite">
                                    {demoMessage}
                                </p>
                            ) : null}

                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
                                <div className="mb-3">
                                    <p className="text-sm font-semibold text-slate-900">Demo access</p>
                                    <p className="text-xs text-slate-500">Loads client demo credentials into the form.</p>
                                </div>
                                <DemoLoginButton
                                    label="Use Client Demo Account"
                                    email="peter@abv.bg"
                                    password="123456"
                                    onFill={handleDemoFill}
                                />
                            </div>

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
                                Do not have an account?{' '}
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
                                    onClick={() => void signIn("github", {
                                        callbackUrl: sanitizeCallbackUrl(searchParams.get("callbackUrl"), "client"),
                                    })}
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
