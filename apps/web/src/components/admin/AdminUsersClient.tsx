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
import { activeStatusTone } from "@/lib/admin-display";
import type { AdminTableColumn } from "@/types/admin";
import type {
  AdminUserListFilters,
  AdminUserListItem,
  AdminUsersClientProps,
} from "@/types/admin-users";

function displayName(user: AdminUserListItem): string {
  return user.fullName?.trim() || user.email.split("@")[0] || user.email;
}

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "Not set";
}

function setParam(params: URLSearchParams, key: string, value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  if (text && text !== "all") params.set(key, text);
}

function usersHref(filters: AdminUserListFilters, updates: Partial<AdminUserListFilters>) {
  const next = { ...filters, ...updates };
  const params = new URLSearchParams();

  if (next.role) params.set("role", next.role);
  if (next.active) params.set("active", next.active);
  if (next.search) params.set("search", next.search);
  if (next.createdFrom) params.set("createdFrom", next.createdFrom);
  if (next.createdTo) params.set("createdTo", next.createdTo);
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== 10) params.set("pageSize", String(next.pageSize));

  const query = params.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

function roleBadgeTone(role: string) {
  return role === "admin" ? "red" : role === "partner" ? "amber" : "neutral";
}

export default function AdminUsersClient({ result }: AdminUsersClientProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateUserStatus(userId: string, isActive: boolean) {
    setPendingId(userId);
    setError(null);

    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error?.message ?? "User update failed.");
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
    setParam(params, "role", form.get("role"));
    setParam(params, "active", form.get("active"));
    setParam(params, "createdFrom", form.get("createdFrom"));
    setParam(params, "createdTo", form.get("createdTo"));
    setParam(params, "sort", form.get("sort"));
    setParam(params, "pageSize", form.get("pageSize"));

    const query = params.toString();
    router.push(query ? `/admin/users?${query}` : "/admin/users");
  }

  const columns: AdminTableColumn<AdminUserListItem>[] = [
    {
      header: "User",
      render: (user) => (
        <div>
          <Link href={`/admin/users/${user.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
            {displayName(user)}
          </Link>
          <p className="mt-1 text-slate-500">{user.email}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">{user.id}</p>
        </div>
      ),
    },
    {
      header: "Roles",
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles.length ? user.roles.map((role) => (
            <AdminStatusBadge key={role} label={role} tone={roleBadgeTone(role)} />
          )) : <AdminStatusBadge label="none" />}
        </div>
      ),
    },
    {
      header: "Status",
      render: (user) => (
        <AdminStatusBadge
          label={user.isActive ? "active" : "inactive"}
          tone={activeStatusTone(user.isActive)}
        />
      ),
    },
    { header: "Phone", render: (user) => user.phone ?? "Not set" },
    { header: "Bookings", render: (user) => user.bookingsCount },
    { header: "Reviews", render: (user) => user.reviewsCount },
    { header: "Created", render: (user) => formatDate(user.createdAt) },
    {
      header: "Actions",
      render: (user) => (
        <div className="flex flex-wrap gap-1.5">
          <AdminActionMenu actions={[{ label: "Inspect", href: `/admin/users/${user.id}`, tone: "blue" }]} />
          <AdminActionButton
            tone={user.isActive ? "red" : "blue"}
            disabled={pendingId === user.id}
            onClick={() => updateUserStatus(user.id, !user.isActive)}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </AdminActionButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminFilters
        filters={[
          { label: "All", href: "/admin/users", active: !result.filters.role && !result.filters.active, count: result.counts.total },
          { label: "Clients", href: usersHref(result.filters, { role: "client", page: 1 }), active: result.filters.role === "client", count: result.counts.clients },
          { label: "Partners", href: usersHref(result.filters, { role: "partner", page: 1 }), active: result.filters.role === "partner", count: result.counts.partners, tone: "amber" },
          { label: "Admins", href: usersHref(result.filters, { role: "admin", page: 1 }), active: result.filters.role === "admin", count: result.counts.admins, tone: "red" },
          { label: "Active", href: usersHref(result.filters, { active: "active", page: 1 }), active: result.filters.active === "active", count: result.counts.active, tone: "blue" },
          { label: "Inactive", href: usersHref(result.filters, { active: "inactive", page: 1 }), active: result.filters.active === "inactive", count: result.counts.inactive, tone: "red" },
        ]}
      />

      <form onSubmit={handleFilterSubmit} className="grid gap-3 rounded-[4px] border border-slate-800 bg-slate-950 p-3 md:grid-cols-3 xl:grid-cols-7">
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 xl:col-span-2">
          Search
          <input name="search" type="search" defaultValue={result.filters.search ?? ""} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Role
          <select name="role" defaultValue={result.filters.role ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            <option value="client">Client</option>
            <option value="partner">Partner</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Status
          <select name="active" defaultValue={result.filters.active ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
            <option value="email">Email</option>
            <option value="role">Role</option>
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
          <Link href="/admin/users" className="inline-flex h-9 items-center rounded-[3px] border border-slate-700 px-3 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:bg-slate-900">
            Reset
          </Link>
        </div>
      </form>

      {error ? (
        <div className="rounded-[4px] border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      <AdminSection title="Users table" description="Database-backed account list with roles, activity state, and account totals.">
        <AdminTable
          rows={result.users}
          columns={columns}
          getRowKey={(user) => user.id}
          emptyState={<AdminEmptyState title="No users found" description="Adjust filters to broaden the account search." />}
        />
      </AdminSection>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
        <span>
          Page {result.pagination.page} of {result.pagination.totalPages} / {result.pagination.totalItems} users
        </span>
        <div className="flex items-center gap-2">
          <Link href={usersHref(result.filters, { page: Math.max(1, result.pagination.page - 1) })} className="rounded-[3px] border border-slate-800 px-3 py-1.5 text-slate-300 hover:border-slate-700">
            Previous
          </Link>
          <Link href={usersHref(result.filters, { page: Math.min(result.pagination.totalPages, result.pagination.page + 1) })} className="rounded-[3px] border border-slate-800 px-3 py-1.5 text-slate-300 hover:border-slate-700">
            Next
          </Link>
        </div>
      </div>
    </>
  );
}

