import {
  ArrowRightIcon,
  LockClosedIcon,
  ServerStackIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#070a0f] text-slate-200">
      <div className="grid min-h-screen lg:grid-cols-[minmax(320px,460px)_1fr]">
        <section className="border-r border-slate-800 bg-[#090d12] px-6 py-8 sm:px-10">
          <div className="flex h-full flex-col">
            <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
              <ServerStackIcon className="h-5 w-5 text-blue-300" aria-hidden="true" />
              Admin Operations
            </Link>

            <div className="my-auto max-w-sm">
              <div className="mb-5 inline-flex border border-slate-800 bg-slate-950 p-2 text-slate-400">
                <LockClosedIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-50">
                Admin sign in
              </h1>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Static access screen for the operations scaffold. Real Auth.js
                validation will be wired later.
              </p>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Admin email
                  </span>
                  <input
                    type="email"
                    defaultValue="admin@bookyourstay.example"
                    className="mt-1 h-10 w-full rounded-[4px] border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Access token
                  </span>
                  <input
                    type="password"
                    defaultValue="visual-scaffold"
                    className="mt-1 h-10 w-full rounded-[4px] border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60"
                  />
                </label>
                <Link
                  href="/admin/dashboard"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[4px] bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Continue to dashboard
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-950 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Session mode
              </p>
              <div className="mt-2 flex items-center gap-2">
                <AdminStatusBadge label="mock" tone="amber" />
                <span className="text-xs text-slate-500">No real auth is executed.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="hidden px-10 py-8 lg:block">
          <div className="grid h-full grid-rows-[auto_1fr_auto] border border-slate-800 bg-slate-950">
            <div className="border-b border-slate-800 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Operations perimeter
              </p>
            </div>
            <div className="grid place-items-center px-8">
              <div className="w-full max-w-2xl">
                <div className="grid grid-cols-3 border border-slate-800 text-xs">
                  {["Identity", "Moderation", "Payments"].map((item) => (
                    <div key={item} className="border-r border-slate-800 p-4 last:border-r-0">
                      <p className="font-semibold text-slate-200">{item}</p>
                      <p className="mt-2 leading-5 text-slate-500">
                        Backoffice access surface prepared for later integration.
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border border-slate-800 bg-[#0b0f14] p-4">
                  <p className="text-xs text-slate-500">
                    This screen intentionally avoids client or partner auth styling:
                    compact spacing, strict borders, no register flow, and no marketing
                    copy.
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-800 px-5 py-3 text-xs text-slate-600">
              Admin Console / Static scaffold / May 2026
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
