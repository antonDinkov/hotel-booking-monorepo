"use client";

import type { AdminActionTone } from "@/types/admin";

type AdminActionButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: AdminActionTone;
};

const toneClasses: Record<AdminActionTone, string> = {
  neutral: "border-slate-700 text-slate-300 hover:bg-slate-900",
  blue: "border-blue-500/40 text-blue-200 hover:bg-blue-500/10",
  amber: "border-amber-500/50 text-amber-200 hover:bg-amber-500/10",
  red: "border-red-500/50 text-red-200 hover:bg-red-500/10",
};

export default function AdminActionButton({
  children,
  onClick,
  disabled = false,
  tone = "neutral",
}: AdminActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center rounded-[3px] border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
        toneClasses[tone],
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

