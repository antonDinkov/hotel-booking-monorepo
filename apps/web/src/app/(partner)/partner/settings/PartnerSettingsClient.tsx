"use client";

import {
  BanknotesIcon,
  BellIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerSection from "@/components/partner/PartnerSection";
import type { PartnerBadgeTone } from "@/types/partner";
import type {
  PartnerAccountSettings,
  PartnerCompanySettings,
  PartnerSettingsApiPayload,
  PartnerSettingsClientProps,
} from "@/types/partner-settings";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-70";

const labelClass = "grid gap-2 text-sm font-medium text-slate-300";

type Notice = {
  tone: "success" | "error";
  message: string;
};

type AccountFormState = {
  fullName: string;
  phone: string;
};

type SecurityFormState = {
  currentPassword: string;
  newPassword: string;
};

type CompanyFormState = {
  companyName: string;
  representativeFirstName: string;
  representativeLastName: string;
  position: string;
  email: string;
  phone: string;
  website: string;
  companyAddress: string;
  vatNumber: string;
};

function toText(value: string | null): string {
  return value ?? "";
}

function getInitials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  return source
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

function verificationTone(status: string): PartnerBadgeTone {
  if (status === "verified") return "emerald";
  if (status === "rejected" || status === "suspended") return "rose";
  return "amber";
}

function formatStatus(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function accountForm(account: PartnerAccountSettings): AccountFormState {
  return {
    fullName: toText(account.fullName),
    phone: toText(account.phone),
  };
}

function companyForm(partner: PartnerCompanySettings): CompanyFormState {
  return {
    companyName: partner.companyName,
    representativeFirstName: partner.representativeFirstName,
    representativeLastName: partner.representativeLastName,
    position: partner.position,
    email: partner.email,
    phone: toText(partner.phone),
    website: toText(partner.website),
    companyAddress: toText(partner.companyAddress),
    vatNumber: toText(partner.vatNumber),
  };
}

function NoticeBox({ notice }: { notice: Notice | null }) {
  if (!notice) return null;

  return (
    <div
      className={[
        "rounded-lg border px-4 py-3 text-sm font-medium",
        notice.tone === "success"
          ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
          : "border-rose-300/30 bg-rose-300/10 text-rose-100",
      ].join(" ")}
    >
      {notice.message}
    </div>
  );
}

function AvatarPreview({ account }: { account: PartnerAccountSettings }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/10 bg-cover bg-center text-lg font-semibold text-amber-100"
        style={account.avatarUrl ? { backgroundImage: `url(${account.avatarUrl})` } : undefined}
        aria-label="Partner avatar"
      >
        {account.avatarUrl ? null : getInitials(account.fullName, account.email)}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-white">{account.fullName || "Partner account"}</p>
        <p className="mt-1 truncate text-sm text-slate-400">{account.email}</p>
        <p className="mt-2 text-xs text-slate-500">
          Avatar is shown from the existing profile image, when available.
        </p>
      </div>
    </div>
  );
}

export default function PartnerSettingsClient({
  initialSettings,
}: PartnerSettingsClientProps) {
  const router = useRouter();
  const [account, setAccount] = useState(initialSettings.account);
  const [partner, setPartner] = useState(initialSettings.partner);
  const [accountState, setAccountState] = useState(() => accountForm(initialSettings.account));
  const [companyState, setCompanyState] = useState(() => companyForm(initialSettings.partner));
  const [securityState, setSecurityState] = useState<SecurityFormState>({
    currentPassword: "",
    newPassword: "",
  });
  const [accountNotice, setAccountNotice] = useState<Notice | null>(null);
  const [companyNotice, setCompanyNotice] = useState<Notice | null>(null);
  const [securityNotice, setSecurityNotice] = useState<Notice | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const updateAccountField = (field: keyof AccountFormState, value: string) => {
    setAccountState((current) => ({ ...current, [field]: value }));
  };

  const updateCompanyField = (field: keyof CompanyFormState, value: string) => {
    setCompanyState((current) => ({ ...current, [field]: value }));
  };

  const updateSecurityField = (field: keyof SecurityFormState, value: string) => {
    setSecurityState((current) => ({ ...current, [field]: value }));
  };

  const saveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAccount(true);
    setAccountNotice(null);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: accountState.fullName,
          phone: accountState.phone,
        }),
      });
      const payload = await response.json().catch(() => null) as
        | PartnerSettingsApiPayload<PartnerAccountSettings>
        | null;

      if (!response.ok || !payload?.data) {
        setAccountNotice({
          tone: "error",
          message: payload?.error?.message ?? "Failed to save account settings.",
        });
        return;
      }

      setAccount(payload.data);
      setAccountState(accountForm(payload.data));
      setAccountNotice({ tone: "success", message: "Account settings saved." });
      router.refresh();
    } catch {
      setAccountNotice({ tone: "error", message: "Failed to save account settings." });
    } finally {
      setSavingAccount(false);
    }
  };

  const saveCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingCompany(true);
    setCompanyNotice(null);

    try {
      const response = await fetch("/api/partners/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyState),
      });
      const payload = await response.json().catch(() => null) as
        | PartnerSettingsApiPayload<PartnerCompanySettings>
        | null;

      if (!response.ok || !payload?.data) {
        setCompanyNotice({
          tone: "error",
          message: payload?.error?.message ?? "Failed to save company settings.",
        });
        return;
      }

      setPartner(payload.data);
      setCompanyState(companyForm(payload.data));
      setCompanyNotice({ tone: "success", message: "Company settings saved." });
      router.refresh();
    } catch {
      setCompanyNotice({ tone: "error", message: "Failed to save company settings." });
    } finally {
      setSavingCompany(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPassword(true);
    setSecurityNotice(null);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(securityState),
      });
      const payload = await response.json().catch(() => null) as
        | PartnerSettingsApiPayload<PartnerAccountSettings>
        | null;

      if (!response.ok || !payload?.data) {
        setSecurityNotice({
          tone: "error",
          message: payload?.error?.message ?? "Failed to update password.",
        });
        return;
      }

      setAccount(payload.data);
      setSecurityState({ currentPassword: "", newPassword: "" });
      setSecurityNotice({ tone: "success", message: "Password updated." });
      router.refresh();
    } catch {
      setSecurityNotice({ tone: "error", message: "Failed to update password." });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PartnerSection title="Account settings">
        <PartnerCard>
          <form className="space-y-4" onSubmit={saveAccount}>
            <div className="flex items-center gap-3 text-amber-200">
              <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-semibold text-white">Partner account profile</h2>
            </div>
            <AvatarPreview account={account} />
            <label className={labelClass}>
              Email
              <input className={inputClass} value={account.email} disabled />
            </label>
            <label className={labelClass}>
              Full name
              <input
                className={inputClass}
                value={accountState.fullName}
                onChange={(event) => updateAccountField("fullName", event.target.value)}
                placeholder="Representative full name"
                autoComplete="name"
              />
            </label>
            <label className={labelClass}>
              Phone
              <input
                className={inputClass}
                value={accountState.phone}
                onChange={(event) => updateAccountField("phone", event.target.value)}
                placeholder="+1 555 0123"
                autoComplete="tel"
              />
            </label>
            <NoticeBox notice={accountNotice} />
            <button
              type="submit"
              disabled={savingAccount}
              className="rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"
            >
              {savingAccount ? "Saving..." : "Save account"}
            </button>
          </form>
        </PartnerCard>
      </PartnerSection>

      <PartnerSection title="Company info">
        <PartnerCard>
          <form className="space-y-4" onSubmit={saveCompany}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-amber-200">
                <BuildingOffice2Icon className="h-5 w-5" aria-hidden="true" />
                <h2 className="font-semibold text-white">Partner business profile</h2>
              </div>
              <PartnerBadge tone={verificationTone(partner.verificationStatus)}>
                {formatStatus(partner.verificationStatus)}
              </PartnerBadge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClass}>
                Company name
                <input
                  className={inputClass}
                  value={companyState.companyName}
                  onChange={(event) => updateCompanyField("companyName", event.target.value)}
                  required
                />
              </label>
              <label className={labelClass}>
                Business email
                <input
                  className={inputClass}
                  type="email"
                  value={companyState.email}
                  onChange={(event) => updateCompanyField("email", event.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label className={labelClass}>
                Representative first name
                <input
                  className={inputClass}
                  value={companyState.representativeFirstName}
                  onChange={(event) => updateCompanyField("representativeFirstName", event.target.value)}
                  required
                  autoComplete="given-name"
                />
              </label>
              <label className={labelClass}>
                Representative last name
                <input
                  className={inputClass}
                  value={companyState.representativeLastName}
                  onChange={(event) => updateCompanyField("representativeLastName", event.target.value)}
                  required
                  autoComplete="family-name"
                />
              </label>
              <label className={labelClass}>
                Position
                <input
                  className={inputClass}
                  value={companyState.position}
                  onChange={(event) => updateCompanyField("position", event.target.value)}
                  required
                />
              </label>
              <label className={labelClass}>
                Phone
                <input
                  className={inputClass}
                  value={companyState.phone}
                  onChange={(event) => updateCompanyField("phone", event.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label className={labelClass}>
                Website
                <input
                  className={inputClass}
                  type="url"
                  value={companyState.website}
                  onChange={(event) => updateCompanyField("website", event.target.value)}
                  placeholder="https://example.com"
                />
              </label>
              <label className={labelClass}>
                VAT number
                <input
                  className={inputClass}
                  value={companyState.vatNumber}
                  onChange={(event) => updateCompanyField("vatNumber", event.target.value)}
                />
              </label>
            </div>
            <label className={labelClass}>
              Company address
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={companyState.companyAddress}
                onChange={(event) => updateCompanyField("companyAddress", event.target.value)}
              />
            </label>
            <p className="text-xs text-slate-500">
              Verification status is managed by the platform and cannot be changed here.
            </p>
            <NoticeBox notice={companyNotice} />
            <button
              type="submit"
              disabled={savingCompany}
              className="rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"
            >
              {savingCompany ? "Saving..." : "Save company"}
            </button>
          </form>
        </PartnerCard>
      </PartnerSection>

      <PartnerSection title="Payout settings">
        <PartnerCard className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-200">
            <BanknotesIcon className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-semibold text-white">Payout account</h2>
          </div>
          <input className={inputClass} value="Configured in payment provider" disabled />
          <select className={inputClass} value="weekly" disabled>
            <option value="weekly">Weekly payouts</option>
          </select>
          <p className="text-xs text-slate-500">
            Payout preferences are not persisted in the current database schema.
          </p>
        </PartnerCard>
      </PartnerSection>

      <PartnerSection title="Password/security">
        <PartnerCard>
          <form className="space-y-4" onSubmit={changePassword}>
            <div className="flex items-center gap-3 text-indigo-200">
              <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-semibold text-white">Security controls</h2>
            </div>
            <label className={labelClass}>
              Current password
              <input
                className={inputClass}
                type="password"
                value={securityState.currentPassword}
                onChange={(event) => updateSecurityField("currentPassword", event.target.value)}
                disabled={!account.canChangePassword || savingPassword}
                autoComplete="current-password"
                required={account.canChangePassword}
              />
            </label>
            <label className={labelClass}>
              New password
              <input
                className={inputClass}
                type="password"
                value={securityState.newPassword}
                onChange={(event) => updateSecurityField("newPassword", event.target.value)}
                disabled={!account.canChangePassword || savingPassword}
                autoComplete="new-password"
                minLength={6}
                required={account.canChangePassword}
              />
            </label>
            {!account.canChangePassword ? (
              <p className="text-sm text-slate-400">
                Password updates are not available for this account.
              </p>
            ) : null}
            <NoticeBox notice={securityNotice} />
            <button
              type="submit"
              disabled={!account.canChangePassword || savingPassword}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingPassword ? "Updating..." : "Update password"}
            </button>
          </form>
        </PartnerCard>
      </PartnerSection>

      <PartnerSection title="Notifications" className="lg:col-span-2">
        <PartnerCard className="space-y-4">
          <div className="flex items-center gap-3 text-amber-200">
            <BellIcon className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-semibold text-white">Notification preferences</h2>
          </div>
          {["New bookings", "Cancellations", "Guest reviews", "Payout summaries"].map((item) => (
            <label
              key={item}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200"
            >
              {item}
              <input
                type="checkbox"
                checked
                disabled
                readOnly
                className="h-4 w-4 accent-amber-300 disabled:opacity-70"
              />
            </label>
          ))}
          <p className="text-xs text-slate-500">
            Notification preferences are scaffolded only because no preference fields exist yet.
          </p>
        </PartnerCard>
      </PartnerSection>
    </div>
  );
}
