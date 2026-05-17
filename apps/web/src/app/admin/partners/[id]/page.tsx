import { notFound, redirect } from "next/navigation";

import AdminPartnerDetailClient from "@/components/admin/AdminPartnerDetailClient";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { parseAdminPartnerId } from "@/lib/admin-partner-validation";
import { getAdminPartnerDetails } from "@/server/services/adminPartners";
import type { AdminDetailPageProps } from "@/types/admin";

async function requireAdmin() {
  const auth = await authorize(["admin"]);
  if (!auth.ok) redirect("/admin/login");
}

export default async function Page({ params }: AdminDetailPageProps) {
  await requireAdmin();

  let partnerId: string;
  try {
    partnerId = parseAdminPartnerId((await params).id);
  } catch {
    notFound();
  }

  const partner = await getAdminPartnerDetails(partnerId);
  if (!partner) notFound();

  return <AdminPartnerDetailClient partner={partner} />;
}
