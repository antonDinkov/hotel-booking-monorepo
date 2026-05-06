import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? session?.user?.name ?? "your account";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-24 px-6 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Profile</h1>
      <p className="mt-4 text-slate-600">Welcome, {email}.</p>
      <p className="mt-6 text-slate-500">Complete your profile or contact support to get a role assigned.</p>
      <div className="mt-8">
        <Link href="/dashboard" prefetch={false} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
