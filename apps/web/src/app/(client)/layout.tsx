import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions, authorize } from "@/app/api/auth/[...nextauth]/route";
import { HeaderNavigation } from "@/components/HeaderNavigation";
import { Footer } from "@/components/Footer";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = await authorize(["client", "admin"]);

    if (!auth.ok) {
        if (auth.error === "unauthenticated") {
            redirect("/login");
        }
    }

    const session = await getServerSession(authOptions);

    return (
        <div className="min-h-screen flex flex-col">
            <HeaderNavigation brandName="BookYourStay" session={session} />
            <div className="flex-1">{children}</div>
            <Footer />
        </div>
    );
}