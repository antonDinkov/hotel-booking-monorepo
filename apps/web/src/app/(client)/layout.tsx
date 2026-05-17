import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { HeaderNavigation } from "@/components/HeaderNavigation";
import { Footer } from "@/components/Footer";
import { getRoleDashboard, hasRequiredRole } from "@/lib/auth/role-routing";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    const roles = session.user.roles ?? [];
    if (!hasRequiredRole(roles, "client")) {
        redirect(getRoleDashboard(roles));
    }

    return (
        <div className="min-h-screen flex flex-col">
            <HeaderNavigation brandName="BookYourStay" session={session} />
            <div className="flex-1">{children}</div>
            <Footer />
        </div>
    );
}
