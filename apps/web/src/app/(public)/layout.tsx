import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { HeaderNavigation } from "@/components/HeaderNavigation";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    return (
        <>
            <HeaderNavigation brandName="BookYourStay" session={session} />
            <div>{children}</div>
        </>
    );
}
