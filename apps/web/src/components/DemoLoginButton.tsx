"use client";

import type { ButtonHTMLAttributes } from "react";

interface DemoLoginButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  label: string;
  email: string;
  password: string;
  onFill: (email: string, password: string) => void;
}

export default function DemoLoginButton({ label, email, password, onFill, className, ...props }: DemoLoginButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onFill(email, password)}
      className={[
        "inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700",
        "shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {label}
    </button>
  );
}