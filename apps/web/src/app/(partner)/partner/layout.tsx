import PartnerLayout from "@/components/partner/PartnerLayout";
import type { PartnerRouteLayoutProps } from "@/types/partner";

export default function Layout({ children }: PartnerRouteLayoutProps) {
  return <PartnerLayout>{children}</PartnerLayout>;
}
