import { redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import { getPartnerSettings } from "@/server/services/partnerSettings";
import PartnerSettingsClient from "./PartnerSettingsClient";

export default async function Page() {
  const auth = await authorize(["partner"]);
  if (!auth.ok || !auth.userId) redirect("/partner/login");

  const settings = await getPartnerSettings(auth.userId);

  return (
    <>
      <PartnerPageHeader
        eyebrow="Workspace controls"
        title="Settings"
        description="Manage account details, partner business profile, security, and scaffolded notification preferences."
      />

      <PartnerSettingsClient initialSettings={settings} />
    </>
  );
}
