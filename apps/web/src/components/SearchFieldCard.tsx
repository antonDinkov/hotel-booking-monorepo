"use client";

import type { SearchField } from "@/types/hotel-panel";
import { CalendarDaysIcon, MapPinIcon, UserGroupIcon } from "@heroicons/react/24/solid";

interface SearchFieldCardProps {
    field: SearchField;
    value: string;
    error?: boolean;
    onChange: (value: string) => void;
}

export function SearchFieldCard({ field, value, onChange, error = false }: SearchFieldCardProps) {
    const icon =
        field.icon === "pin" ? (
            <MapPinIcon className="h-5 w-5 text-slate-500" />
        ) : field.icon === "calendar" ? (
            <CalendarDaysIcon className="h-5 w-5 text-slate-500" />
        ) : (
            <UserGroupIcon className="h-5 w-5 text-slate-500" />
        );

    return (
        <div
            className={`flex min-h-18 items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-[0_10px_25px_rgba(15,23,42,0.08)] ring-1 ring-white/70 ${
                error ? "border-red-500 ring-red-200" : "border-slate-300"
            }`}
        >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{field.label}</p>
                <input
                    type={field.icon === "calendar" ? "date" : "text"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    aria-invalid={error}
                    className="w-full bg-transparent text-sm font-semibold text-slate-950 placeholder-slate-400 focus:outline-none"
                />
            </div>
        </div>
    );
}