import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserRoles } from "@/server/services/auth";

export default async function NotFound() {
  const session = await getServerSession(authOptions);

  let href = "/";
  let label = "Back to home";

  if (session?.user?.id) {
    const roles = await getUserRoles(session.user.id as string);
    if (roles.includes("admin")) {
      href = "/admin/dashboard";
      label = "Back to admin dashboard";
    } else if (roles.includes("partner")) {
      href = "/partner/dashboard";
      label = "Back to partner dashboard";
    } else {
      href = "/dashboard";
      label = "Back to dashboard";
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-24 px-6 text-center">
      <h1 className="text-6xl font-extrabold text-slate-900">404</h1>
      <p className="mt-4 text-xl text-slate-600">Page not found</p>
      <p className="mt-6 max-w-xl text-slate-500">Sorry, we couldn’t find the page you’re looking for.</p>
      <div className="mt-8">
        <Link href={href} className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">
          {label}
        </Link>
      </div>
    </main>
  );
}
