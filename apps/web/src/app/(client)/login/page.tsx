import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getUserRoles } from "@/server/services/auth";

export default async function LoginPage() {
    const session = await getServerSession(authOptions);
    console.log(`This is user session id: ${session?.user?.id}`);
    
    if (session?.user?.id) {
        const roles = await getUserRoles(session.user.id as string);
        console.log(`This is user roles: ${roles}`);
        if (roles.includes("admin")) return redirect("/admin/dashboard");
        if (roles.includes("partner")) return redirect("/partner/dashboard");
        return redirect("/dashboard");
    }

    return <LoginForm />;
}
