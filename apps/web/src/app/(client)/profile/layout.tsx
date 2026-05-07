import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getUserRoles } from "@/server/services/auth";
import Link from "next/link";
import type { ReactNode } from "react";

export default async function ProfileLayout({ children }: { children: ReactNode }) {
    const session: any = await getServerSession(authOptions);

    const roles = await getUserRoles(session.user.id as string);
    // If partner — send to partner dashboard.
    if (roles.includes("partner")) return redirect("/partner/dashboard");

    return <>{children}</>;
}
