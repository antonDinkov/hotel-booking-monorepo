"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
}

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function AppButton({
  variant = "primary",
  size = "md",
  leftIcon,
  className,
  children,
  type = "button",
  ...props
}: AppButtonProps) {
  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-blue-700 text-white shadow-lg shadow-blue-700/20 hover:bg-blue-800",
    secondary: "border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50",
    ghost: "bg-transparent text-blue-700 hover:bg-blue-50 hover:text-blue-800",
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-sm",
  };

  return (
    <button
      type={type}
      className={joinClasses(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {leftIcon}
      {children}
    </button>
  );
}