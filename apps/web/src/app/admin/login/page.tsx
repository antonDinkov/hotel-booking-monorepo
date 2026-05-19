import { Suspense } from "react";

import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
