"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import AdminActionButton from "@/components/admin/AdminActionButton";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import { verificationStatusTone } from "@/lib/admin-display";
import type { AdminTableColumn } from "@/types/admin";
import type {
  AdminPartnerListFilters,
  AdminPartnerListItem,
  AdminPartnersClientProps,
  AdminPartnerVerificationStatus,
} from "@/types/admin-partners";

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "Not set";
}

function setParam(params: URLSearchParams, key: string, value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  if (text && text !== "all") params.set(key, text);
}

function partnersHref(
  filters: AdminPartnerListFilters,
  updates: Partial<AdminPartnerListFilters>
) {
  const next = { ...filters, ...updates };
  const params = new URLSearchParams();

  if (next.verificationStatus) params.set("verificationStatus", next.verificationStatus);
  if (next.verified) params.set("verified", next.verified);
  if (next.search) params.set("search", next.search);
  if (next.createdFrom) params.set("createdFrom", next.createdFrom);
  if (next.createdTo) params.set("createdTo", next.createdTo);
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== 10) params.set("pageSize", String(next.pageSize));

  const query = params.toString();
  return query ? `/admin/partners?${query}` : "/admin/partners";
}

const actionOptions: Array<{
  label: string;
  status: AdminPartnerVerificationStatus;
  tone: "blue" | "amber" | "red" | "neutral";
}> = [
  { label: "Pending", status: "pending", tone: "amber" },
  { label: "Approve", status: "verified", tone: "blue" },
  { label: "Reject", status: "rejected", tone: "red" },
  { label: "Suspend", status: "suspended", tone: "red" },
];

export default function AdminPartnersClient({ result }: AdminPartnersClientProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updatePartnerStatus(
    partnerId: string,
    verificationStatus: AdminPartnerVerificationStatus
  ) {
    setPendingId(partnerId);
    setError(null);

    const response = await fetch(`/api/partners/${partnerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationStatus }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error?.message ?? "Partner update failed.");
    } else {
      router.refresh();
    }

    setPendingId(null);
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    setParam(params, "search", form.get("search"));
    setParam(params, "verificationStatus", form.get("verificationStatus"));
    setParam(params, "verified", form.get("verified"));
    setParam(params, "createdFrom", form.get("createdFrom"));
    setParam(params, "createdTo", form.get("createdTo"));
    setParam(params, "sort", form.get("sort"));
    setParam(params, "pageSize", form.get("pageSize"));

    const query = params.toString();
    router.push(query ? `/admin/partners?${query}` : "/admin/partners");
  }

  const columns: AdminTableColumn<AdminPartnerListItem>[] = [
    {
      header: "Partner",
      render: (partner) => (
        <div>
          <Link href={`/admin/partners/${partner.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
            {partner.companyName}
          </Link>
          <p className="mt-1 text-slate-500">{partner.email}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">{partner.id}</p>
        </div>
      ),
    },
    {
      header: "Representative",
      render: (partner) => (
        <div>
          <p className="text-slate-300">{partner.representativeName}</p>
          <p className="mt-1 text-slate-500">{partner.phone ?? "No phone"}</p>
          <p className="mt-1 text-slate-500">{partner.website ?? "No website"}</p>
        </div>
      ),
    },
    {
      header: "Verification",
      render: (partner) => (
        <AdminStatusBadge
          label={partner.verificationStatus}
          tone={verificationStatusTone(partner.verificationStatus)}
        />
      ),
    },
    {
      header: "Verified",
      render: (partner) => (
        <AdminStatusBadge
          label={partner.isVerified ? "true" : "false"}
          tone={partner.isVerified ? "blue" : "red"}
        />
      ),
    },
    { header: "Hotels", render: (partner) => partner.hotelsCount },
    { header: "Bookings", render: (partner) => partner.bookingsCount },
    { header: "Reviews", render: (partner) => partner.reviewsCount },
    { header: "Created", render: (partner) => formatDate(partner.createdAt) },
    {
      header: "Actions",
      render: (partner) => (
        <div className="flex flex-wrap gap-1.5">
          <AdminActionMenu actions={[{ label: "Inspect", href: `/admin/partners/${partner.id}`, tone: "blue" }]} />
          {actionOptions.map((action) => (
            <AdminActionButton
              key={action.status}
              tone={action.tone}
              disabled={pendingId === partner.id || partner.verificationStatus === action.status}
              onClick={() => updatePartnerStatus(partner.id, action.status)}
            >
              {action.label}
            </AdminActionButton>
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminFilters
        filters={[
          { label: "All", href: "/admin/partners", active: !result.filters.verificationStatus && !result.filters.verified, count: result.counts.total },
          { label: "Pending", href: partnersHref(result.filters, { verificationStatus: "pending", page: 1 }), active: result.filters.verificationStatus === "pending", count: result.counts.pending, tone: "amber" },
          { label: "Verified", href: partnersHref(result.filters, { verificationStatus: "verified", page: 1 }), active: result.filters.verificationStatus === "verified", count: result.counts.verified, tone: "blue" },
          { label: "Rejected", href: partnersHref(result.filters, { verificationStatus: "rejected", page: 1 }), active: result.filters.verificationStatus === "rejected", count: result.counts.rejected, tone: "red" },
          { label: "Suspended", href: partnersHref(result.filters, { verificationStatus: "suspended", page: 1 }), active: result.filters.verificationStatus === "suspended", count: result.counts.suspended, tone: "red" },
          { label: "isVerified", href: partnersHref(result.filters, { verified: "verified", page: 1 }), active: result.filters.verified === "verified", count: result.counts.verifiedProfiles, tone: "blue" },
          { label: "Unverified", href: partnersHref(result.filters, { verified: "unverified", page: 1 }), active: result.filters.verified === "unverified", count: result.counts.unverifiedProfiles, tone: "amber" },
        ]}
      />

      <form onSubmit={handleFilterSubmit} className="grid gap-3 rounded-[4px] border border-slate-800 bg-slate-950 p-3 md:grid-cols-3 xl:grid-cols-7">
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 xl:col-span-2">
          Search
          <input name="search" type="search" defaultValue={result.filters.search ?? ""} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Verification
          <select name="verificationStatus" defaultValue={result.filters.verificationStatus ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          isVerified
          <select name="verified" defaultValue={result.filters.verified ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          From
          <input name="createdFrom" type="date" defaultValue={result.filters.createdFrom ?? ""} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          To
          <input name="createdTo" type="date" defaultValue={result.filters.createdTo ?? ""} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Sort
          <select name="sort" defaultValue={result.filters.sort} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="company">Company</option>
            <option value="verification">Verification</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Page size
          <select name="pageSize" defaultValue={result.filters.pageSize} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="h-9 rounded-[3px] border border-blue-500/40 px-3 text-xs font-semibold uppercase tracking-wide text-blue-200 transition hover:bg-blue-500/10">
            Apply
          </button>
          <Link href="/admin/partners" className="inline-flex h-9 items-center rounded-[3px] border border-slate-700 px-3 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:bg-slate-900">
            Reset
          </Link>
        </div>
      </form>

      {error ? (
        <div className="rounded-[4px] border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      <AdminSection title="Partners table" description="Database-backed partner profiles, verification state, and portfolio totals.">
        <AdminTable
          rows={result.partners}
          columns={columns}
          getRowKey={(partner) => partner.id}
          emptyState={<AdminEmptyState title="No partners found" description="Adjust filters to broaden the partner search." />}
        />
      </AdminSection>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
        <span>
          Page {result.pagination.page} of {result.pagination.totalPages} / {result.pagination.totalItems} partners
        </span>
        <div className="flex items-center gap-2">
          <Link href={partnersHref(result.filters, { page: Math.max(1, result.pagination.page - 1) })} className="rounded-[3px] border border-slate-800 px-3 py-1.5 text-slate-300 hover:border-slate-700">
            Previous
          </Link>
          <Link href={partnersHref(result.filters, { page: Math.min(result.pagination.totalPages, result.pagination.page + 1) })} className="rounded-[3px] border border-slate-800 px-3 py-1.5 text-slate-300 hover:border-slate-700">
            Next
          </Link>
        </div>
      </div>
    </>
  );
}

