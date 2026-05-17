import { redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import PartnerHotelForm from "@/components/partner/PartnerHotelForm";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";

export default async function Page() {
  const auth = await authorize(["partner"]);
  if (!auth.ok) redirect("/partner/login");

  return (
    <>
      <PartnerPageHeader
        eyebrow="New listing"
        title="Add hotel"
        description="Add another property to your partner portfolio with core details, media, and payment methods."
      />
      <PartnerHotelForm mode="new" />
    </>
  );
}
