import PartnerHotelForm from "@/components/partner/PartnerHotelForm";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";

export default function Page() {
  return (
    <>
      <PartnerPageHeader
        eyebrow="New listing"
        title="Add hotel"
        description="Add another property to your partner portfolio with business, location, media, policy, and payment sections."
      />
      <PartnerHotelForm mode="new" />
    </>
  );
}
