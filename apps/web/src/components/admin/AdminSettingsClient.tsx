"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import type {
  AdminAccountSettings,
  AdminSettingsApiPayload,
  AdminSettingsClientProps,
} from "@/types/admin-settings";

const inputClass =
  "h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 disabled:cursor-not-allowed disabled:opacity-70";
const labelClass = "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600";

type Notice = {
  tone: "success" | "error";
  message: string;
};

type AccountFormState = {
  fullName: string;
  phone: string;
};

function toText(value: string | null): string {
  return value ?? "";
}

function accountForm(settings: AdminAccountSettings): AccountFormState {
  return {
    fullName: toText(settings.fullName),
    phone: toText(settings.phone),
  };
}

function getInitials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  return source
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";
}

function roleTone(role: string) {
  return role === "admin" ? "red" : role === "partner" ? "amber" : "neutral";
}

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "Not set";
}

function NoticeBox({ notice }: { notice: Notice | null }) {
  if (!notice) return null;

  return (
    <div
      className={[
        "rounded-[4px] border px-3 py-2 text-xs",
        notice.tone === "success"
          ? "border-blue-500/40 bg-blue-500/10 text-blue-100"
          : "border-red-500/50 bg-red-500/10 text-red-200",
      ].join(" ")}
    >
      {notice.message}
    </div>
  );
}

function AvatarPreview({ settings }: { settings: AdminAccountSettings }) {
  return (
    <div className="flex items-center gap-4 border border-slate-800 bg-slate-950 p-4">
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[4px] border border-blue-500/30 bg-blue-500/10 bg-cover bg-center text-lg font-semibold text-blue-100"
        style={settings.avatarUrl ? { backgroundImage: `url(${settings.avatarUrl})` } : undefined}
        aria-label="Admin avatar"
      >
        {settings.avatarUrl ? null : getInitials(settings.fullName, settings.email)}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-100">{settings.fullName || "Admin account"}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{settings.email}</p>
        <p className="mt-2 text-xs text-slate-600">
          Avatar is displayed from the existing profile image when one is present.
        </p>
      </div>
    </div>
  );
}

export default function AdminSettingsClient({
  initialSettings,
}: AdminSettingsClientProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [formState, setFormState] = useState(() => accountForm(initialSettings));
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateField(field: keyof AccountFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setNotice(null);

    try {
      const response = await fetch("/api/users/me?scope=admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const payload = await response.json().catch(() => null) as
        | AdminSettingsApiPayload<AdminAccountSettings>
        | null;

      if (!response.ok || !payload?.data) {
        setNotice({
          tone: "error",
          message: payload?.error?.message ?? "Failed to save admin settings.",
        });
        return;
      }

      setSettings(payload.data);
      setFormState(accountForm(payload.data));
      setNotice({ tone: "success", message: "Admin profile saved." });
      router.refresh();
    } catch {
      setNotice({ tone: "error", message: "Failed to save admin settings." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
      <AdminSection title="Account profile">
        <AdminPanel className="p-4">
          <form className="space-y-4" onSubmit={saveAccount}>
            <AvatarPreview settings={settings} />
            <label className={labelClass}>
              Email
              <input className={inputClass} value={settings.email} disabled />
            </label>
            <label className={labelClass}>
              Full name
              <input
                className={inputClass}
                value={formState.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                placeholder="Admin full name"
                autoComplete="name"
              />
            </label>
            <label className={labelClass}>
              Phone
              <input
                className={inputClass}
                value={formState.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+1 555 0123"
                autoComplete="tel"
              />
            </label>
            <NoticeBox notice={notice} />
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 rounded-[3px] border border-blue-500/40 px-3 text-xs font-semibold uppercase tracking-wide text-blue-200 transition hover:bg-blue-500/10 disabled:cursor-wait disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </AdminPanel>
      </AdminSection>

      <div className="space-y-5">
        <AdminSection title="Security info">
          <AdminPanel className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <p className="text-xs font-semibold text-slate-100">Account status</p>
              <AdminStatusBadge label={settings.isActive ? "active" : "inactive"} tone={settings.isActive ? "blue" : "red"} />
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <p className="text-xs font-semibold text-slate-100">Password login</p>
              <AdminStatusBadge label={settings.canChangePassword ? "available" : "external"} tone={settings.canChangePassword ? "blue" : "neutral"} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-600">Created</p>
              <p className="mt-1 text-xs text-slate-300">{formatDate(settings.createdAt)}</p>
            </div>
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Roles">
          <AdminPanel className="space-y-3 p-4">
            <div className="flex flex-wrap gap-1.5">
              {settings.roles.map((role) => (
                <AdminStatusBadge key={role} label={role} tone={roleTone(role)} />
              ))}
            </div>
            <p className="text-xs leading-5 text-slate-500">
              Roles are read-only in Admin Settings and must be managed through the user administration flow.
            </p>
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Notifications">
          <AdminPanel className="space-y-2 p-4">
            {["Critical system health", "Payment webhook failures", "Security account changes"].map((item) => (
              <label
                key={item}
                className="flex items-center justify-between gap-3 border border-slate-800 bg-[#070a0f] px-3 py-2 text-xs text-slate-300"
              >
                {item}
                <input type="checkbox" checked disabled readOnly className="h-4 w-4 accent-blue-400 disabled:opacity-60" />
              </label>
            ))}
            <p className="text-xs leading-5 text-slate-500">
              Notification preferences are read-only because no preference fields exist in the current database schema.
            </p>
          </AdminPanel>
        </AdminSection>
      </div>
    </div>
  );
}
