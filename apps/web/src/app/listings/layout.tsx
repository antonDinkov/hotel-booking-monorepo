import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Footer } from "@/components/Footer";
import { HeaderNavigation } from "@/components/HeaderNavigation";

export default async function ListingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    return (
        <div className="min-h-screen flex flex-col">
            <HeaderNavigation brandName="BookYourStay" session={session} />
            <div className="flex-1">{children}</div>
            <Footer />
        </div>
    );
}