import PartnerHotelForm from "@/components/partner/PartnerHotelForm";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";

export default function Page() {
  return (
    <>
      <PartnerPageHeader
        eyebrow="New listing"
        title="Add hotel"
        description="A visual-only hotel creation form with business, location, media, policy, and payment sections."
      />
      <PartnerHotelForm mode="new" />
    </>
  );
}
