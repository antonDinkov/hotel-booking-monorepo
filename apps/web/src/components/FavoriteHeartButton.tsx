"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon as OutlineHeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as SolidHeartIcon } from "@heroicons/react/24/solid";

import type { FavoriteMutationResult } from "@/types/favorite";

const COOLDOWN_SECONDS = 5 * 60;

type FavoriteButtonSize = "sm" | "md" | "lg";
type FavoriteButtonVariant = "floating" | "inline";

interface FavoriteHeartButtonProps {
  hotelId: number | string;
  initialIsFavorite: boolean;
  size?: FavoriteButtonSize;
  variant?: FavoriteButtonVariant;
  className?: string;
  isAuthenticated?: boolean;
  loginHref?: string;
  onFavoriteChange?: (hotelId: number, isFavorite: boolean) => void;
}

type FavoritePayload = {
  data?: FavoriteMutationResult;
  error?: {
    message?: string;
  };
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getRemainingSeconds(lockedUntil: number | null, now: number): number {
  if (!lockedUntil) return 0;
  return Math.max(0, Math.ceil((lockedUntil - now) / 1000));
}

export function FavoriteHeartButton({
  hotelId,
  initialIsFavorite,
  size = "md",
  variant = "floating",
  className,
  isAuthenticated = true,
  loginHref = "/login",
  onFavoriteChange,
}: FavoriteHeartButtonProps) {
  const router = useRouter();
  const numericHotelId = Number(hotelId);
  const [isFavorite, setIsFavorite] = useState(() => initialIsFavorite);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  const remainingSeconds = getRemainingSeconds(lockedUntil, now);
  const isLocked = remainingSeconds > 0;
  const disabled = isLocked || isUpdating || !Number.isInteger(numericHotelId) || numericHotelId < 1;

  useEffect(() => {
    if (!lockedUntil) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [lockedUntil]);

  useEffect(() => {
    if (lockedUntil && remainingSeconds === 0) {
      setLockedUntil(null);
    }
  }, [lockedUntil, remainingSeconds]);

  const startCooldown = () => {
    setNow(Date.now());
    setLockedUntil(Date.now() + COOLDOWN_SECONDS * 1000);
  };

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }

    if (disabled) return;

    const previousValue = isFavorite;
    const nextValue = !previousValue;
    setError(null);
    setIsUpdating(true);
    setIsFavorite(nextValue);
    startCooldown();

    try {
      const response = await fetch("/api/favorites", {
        method: previousValue ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId: numericHotelId }),
      });
      const payload = await response.json().catch(() => null) as FavoritePayload | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error?.message ?? "Unable to update favorites.");
      }

      setIsFavorite(payload.data.isFavorite);
      onFavoriteChange?.(numericHotelId, payload.data.isFavorite);
    } catch (updateError) {
      setIsFavorite(previousValue);
      setError(updateError instanceof Error ? updateError.message : "Unable to update favorites.");
    } finally {
      setIsUpdating(false);
    }
  };

  const tooltip = isLocked
    ? `You can click it again in ${formatRemaining(remainingSeconds)}`
    : isFavorite
      ? "Remove from your favorites"
      : "Save to your favorites";
  const Icon = isFavorite ? SolidHeartIcon : OutlineHeartIcon;

  const sizeClass = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-12 w-12",
  }[size];
  const iconClass = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-7 w-7",
  }[size];
  const variantClass = variant === "floating"
    ? "border-white/70 bg-white/90 shadow-lg shadow-slate-900/15 backdrop-blur hover:bg-white"
    : "border-slate-200 bg-white shadow-sm hover:border-rose-200 hover:bg-rose-50";

  return (
    <span className="inline-flex" title={tooltip}>
      <button
        type="button"
        aria-label={tooltip}
        aria-pressed={isFavorite}
        disabled={disabled}
        onClick={handleClick}
        className={cx(
          "inline-flex items-center justify-center rounded-full border transition duration-200",
          "focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2",
          isFavorite ? "text-rose-600" : "text-slate-700 hover:text-rose-600",
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:scale-105",
          sizeClass,
          variantClass,
          className
        )}
      >
        <Icon className={iconClass} />
      </button>
      {error ? <span className="sr-only" aria-live="polite">{error}</span> : null}
    </span>
  );
}
