import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getUserRoles } from "@/server/services/auth";
import type { ReactNode } from "react";

export default async function HotelsLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/partner/login");

  const roles = await getUserRoles(session.user.id as string);
  if (!(roles.includes("partner") || roles.includes("admin"))) {
    if (roles.includes("client")) return redirect("/dashboard");
    return redirect("/");
  }

  return <>{children}</>;
}
