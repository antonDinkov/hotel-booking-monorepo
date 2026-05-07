import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserRoles } from "@/server/services/auth";
import type { ReactNode } from "react";

export default async function BookingsLayout({ children }: { children: ReactNode }) {
  const session: any = await getServerSession(authOptions);

  const roles = await getUserRoles(session.user.id as string);
  if (!(roles.includes("client") || roles.includes("admin"))) {
    if (roles.includes("partner")) return redirect("/partner/dashboard");
    return redirect("/");
  }

  return <>{children}</>;
}