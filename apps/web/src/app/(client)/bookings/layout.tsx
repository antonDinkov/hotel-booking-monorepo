import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getUserRoles } from "@/server/services/auth";
import type { ReactNode } from "react";
import type { Session } from "next-auth";

export default async function BookingsLayout({ children }: { children: ReactNode }) {
  const session: Session | null = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const roles = await getUserRoles(session.user.id);
  if (!(roles.includes("client") || roles.includes("admin"))) {
    if (roles.includes("partner")) return redirect("/partner/dashboard");
    return redirect("/");
  }

  return <>{children}</>;
}
