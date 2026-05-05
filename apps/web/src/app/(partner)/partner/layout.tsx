import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getUserRoles } from "@/server/services/auth";
import type { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  // Partner root layout: only guests should see the partner landing/login/register pages.
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const roles = await getUserRoles(session.user.id as string);
    if (roles.includes("admin")) return redirect("/admin/dashboard");
    if (roles.includes("partner")) return redirect("/partner/dashboard");
    return redirect("/dashboard");
  }

  return <>{children}</>;
}
