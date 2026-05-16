import AdminLayout from "@/components/admin/AdminLayout";
import type { AdminRouteLayoutProps } from "@/types/admin";

export default function Layout({ children }: AdminRouteLayoutProps) {
  return <AdminLayout>{children}</AdminLayout>;
}
