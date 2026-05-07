"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { AppButton } from "./AppButton";
import { BuildingStorefrontIcon } from "@heroicons/react/24/solid";

function BrandMark() {
    return <BuildingStorefrontIcon className="h-7 w-7 text-blue-700" />;
}

interface HeaderNavigationProps {
    brandName: string;
    session: any;
}

export function HeaderNavigation({
    brandName,
    session,
}: HeaderNavigationProps) {
    const isLoading = false;
    const isLoggedIn = Boolean(session);
    const userEmail = session?.user?.email ?? session?.user?.name ?? null;
    const pathname = usePathname() ?? "/";
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);

    // normalize pathnames to avoid mismatches with trailing slashes
    const normalizedPath = pathname.replace(/\/+$/, "") || "/";
    const normalize = (p: string) => (p === "/" ? "/" : p.replace(/\/+$/, ""));

    // Use the router-provided `pathname` (via usePathname) to determine active state.
    // We also track a short-lived `clickedPath` state so the UI reflects the
    // intended target immediately on the first click (before the router updates).
    const [clickedPath, setClickedPath] = useState<string | null>(null);
    useEffect(() => {
        // Clear the transient clicked path once the real pathname changes
        setClickedPath(null);
    }, [normalizedPath]);

    const isActive = (href: string) => {
        const current = normalizedPath;
        const target = normalize(href);

        if (clickedPath === target) return true;
        if (target === "/") return current === "/";
        return current === target || current.startsWith(target + "/");
    };

    const activeButtonClasses = "bg-blue-700 text-white shadow-lg shadow-blue-700/20 hover:bg-blue-800 border-transparent btn-active";
    const inactiveButtonClasses = "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50";
    // homeHref redirect logged in users to /dashboard or / when clicking the brand link 
    const homeHref = isLoggedIn ? "/dashboard" : "/";
    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut({ redirect: false });
            setTimeout(() => {
                router.push("/");
            }, 2000);
        } finally {
            setIsSigningOut(false);
        }
    };
    return (
        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <Link href={homeHref} prefetch={false} className="flex items-center gap-2.5 text-[1.15rem] font-extrabold tracking-tight text-blue-950">
                    <BrandMark />
                    {brandName}
                </Link>
                {isLoading ? (
                    <div className="flex items-center gap-2 sm:gap-3" aria-live="polite">
                        <span className="h-9 w-40 animate-pulse rounded-full bg-slate-200/70" aria-hidden />
                        <span className="h-9 w-24 animate-pulse rounded-lg bg-slate-200/70" aria-hidden />
                        <span className="h-9 w-28 animate-pulse rounded-lg bg-slate-200/70" aria-hidden />
                    </div>
                ) : !isLoggedIn ? (
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link href="/login" aria-current={isActive("/login") ? "page" : undefined}>
                            <AppButton
                                onClick={() => setClickedPath("/login")}
                                variant={isActive("/login") ? "primary" : "secondary"}
                                size="md"
                                className={isActive("/login") ? activeButtonClasses : inactiveButtonClasses}
                            >
                                Login
                            </AppButton>
                        </Link>

                        <Link href="/register" aria-current={isActive("/register") ? "page" : undefined}>
                            <AppButton
                                onClick={() => setClickedPath("/register")}
                                variant={isActive("/register") ? "primary" : "secondary"}
                                size="md"
                                className={isActive("/register") ? activeButtonClasses : inactiveButtonClasses}
                            >
                                Register
                            </AppButton>
                        </Link>

                        <Link href="/partner" aria-current={isActive("/partner") ? "page" : undefined}>
                            <AppButton
                                onClick={() => setClickedPath("/partner")}
                                variant={isActive("/partner") ? "primary" : "secondary"}
                                size="md"
                                className={isActive("/partner") ? activeButtonClasses : inactiveButtonClasses}
                            >
                                For Hosts
                            </AppButton>
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 sm:gap-3">
                        {userEmail ? (
                            <p className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 sm:block">
                                {userEmail}
                            </p>
                        ) : null}

                        <Link href="/dashboard" prefetch={false} aria-current={isActive("/dashboard") ? "page" : undefined} className="relative inline-flex">
                            <AppButton
                                onClick={() => setClickedPath("/dashboard")}
                                variant={isActive("/dashboard") ? "primary" : "secondary"}
                                size="md"
                                className={isActive("/dashboard") ? activeButtonClasses : inactiveButtonClasses}
                            >
                                Dashboard
                            </AppButton>
                        </Link>

                        <Link href="/bookings" prefetch={false} aria-current={isActive("/bookings") ? "page" : undefined} className="relative inline-flex">
                            <AppButton
                                onClick={() => setClickedPath("/bookings")}
                                variant={isActive("/bookings") ? "primary" : "secondary"}
                                size="md"
                                className={isActive("/bookings") ? activeButtonClasses : inactiveButtonClasses}
                            >
                                My Bookings
                            </AppButton>
                        </Link>

                        <Link href="/profile" prefetch={false} aria-current={isActive("/profile") ? "page" : undefined} className="relative inline-flex">
                            <AppButton
                                onClick={() => setClickedPath("/profile")}
                                variant={isActive("/profile") ? "primary" : "secondary"}
                                size="md"
                                className={isActive("/profile") ? activeButtonClasses : inactiveButtonClasses}
                            >
                                Profile
                            </AppButton>
                        </Link>

                        <AppButton variant="secondary" size="md" onClick={handleSignOut} disabled={isSigningOut}>
                            {isSigningOut ? "Signing out..." : "Logout"}
                        </AppButton>
                    </div>
                )}
            </div>
        </header>
    );
}
