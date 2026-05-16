import { redirect } from "next/navigation";
import { partnerHotelHref } from "@/lib/admin-mock-data";
import type { AdminDetailPageProps } from "@/types/admin";

export default async function Page({ params }: AdminDetailPageProps) {
  const { id } = await params;

  redirect(partnerHotelHref(id));
}
