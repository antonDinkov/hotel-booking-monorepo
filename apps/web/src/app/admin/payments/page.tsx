import { redirect } from "next/navigation";

import AdminPanel from "@/components/admin/AdminPanel";
import AdminPaymentsClient from "@/components/admin/AdminPaymentsClient";
import AdminSection from "@/components/admin/AdminSection";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { parseAdminPaymentFilters } from "@/lib/admin-payment-validation";
import { listAdminPayments } from "@/server/services/adminPayments";

type AdminPaymentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function requireAdmin() {
  const auth = await authorize(["admin"]);
  if (!auth.ok) redirect("/admin/login");
}

export default async function Page({ searchParams }: AdminPaymentsPageProps) {
  await requireAdmin();

  let filters;
  try {
    filters = parseAdminPaymentFilters(await searchParams);
  } catch {
    return (
      <>
        <PaymentsPageHeader />
        <AdminSection title="Invalid filters">
          <AdminPanel className="p-4 text-xs leading-6 text-red-200">
            The current payments query contains invalid payment, booking, hotel,
            partner, date, sort, or pagination values.
          </AdminPanel>
        </AdminSection>
      </>
    );
  }

  const result = await listAdminPayments(filters);

  return (
    <>
      <PaymentsPageHeader />
      <AdminPaymentsClient result={result} />
    </>
  );
}

function PaymentsPageHeader() {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
        Finance operations
      </p>
      <h1 className="text-xl font-semibold tracking-tight text-slate-50">
        Payments
      </h1>
      <p className="max-w-3xl text-xs leading-5 text-slate-500">
        Booking-backed payment monitoring using payment fields maintained by
        checkout, cash collection, cancellation, and Stripe webhook flows.
      </p>
    </div>
  );
}
