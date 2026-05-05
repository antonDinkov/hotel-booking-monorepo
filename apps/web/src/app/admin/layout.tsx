import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getUserRoles } from "@/server/services/auth";
import Link from "next/link";
import type { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center py-24 px-6 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Admin area</h1>
        <p className="mt-4 text-slate-600">You need to sign in as an admin to access this area.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/login" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Sign in
          </Link>
          <Link href="/" className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const roles = await getUserRoles(session.user.id as string);
  if (!roles.includes("admin")) return redirect("/");

  return <>{children}</>;
}
