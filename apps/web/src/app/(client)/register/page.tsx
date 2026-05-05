import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { getUserRoles } from "@/server/services/auth";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    const roles = await getUserRoles(session.user.id as string);
    if (roles.includes("admin")) return redirect("/admin/dashboard");
    if (roles.includes("partner")) return redirect("/partner/dashboard");
    return redirect("/dashboard");
  }

  return <RegisterForm />;
}
