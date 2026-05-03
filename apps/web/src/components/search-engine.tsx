"use client";

import { useState } from "react";
import { MapPinIcon, CalendarDaysIcon, UserGroupIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import type { SearchField } from "../types/hotel-panel";
import { AppButton } from "./app-button";

// Using heroicons from @heroicons/react

function SearchFieldCard({
    field,
    value,
    onChange,
}: {
    field: SearchField;
    value: string;
    onChange: (value: string) => void;
}) {
    const icon =
        field.icon === "pin" ? (
            <MapPinIcon className="h-5 w-5 text-slate-500" />
        ) : field.icon === "calendar" ? (
            <CalendarDaysIcon className="h-5 w-5 text-slate-500" />
        ) : (
            <UserGroupIcon className="h-5 w-5 text-slate-500" />
        );

    return (
        <div className="flex min-h-18 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-[0_10px_25px_rgba(15,23,42,0.08)] ring-1 ring-white/70">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{field.label}</p>
                <input
                    type={field.icon === "calendar" ? "date" : "text"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full text-sm font-semibold text-slate-950 bg-transparent placeholder-slate-400 focus:outline-none"
                />
            </div>
        </div>
    );
}

export function SearchEngine({
    searchFields,
    ctaLabel,
    onSearch,
}: {
    searchFields: SearchField[];
    ctaLabel: string;
    onSearch?: (searchParams: { destination?: string; checkInDate?: string; checkOutDate?: string; guests?: string }) => void;
}) {
    const [searchValues, setSearchValues] = useState<Record<string, string>>({
        destination: "",
        checkInDate: "",
        checkOutDate: "",
        guests: "",
    });

    const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (onSearch) {
            onSearch({
                destination: searchValues.destination || undefined,
                checkInDate: searchValues.checkInDate || undefined,
                checkOutDate: searchValues.checkOutDate || undefined,
                guests: searchValues.guests || undefined,
            });
        }
    };

    return (
        <form onSubmit={handleSearch}>
            <div className="relative z-20 mt-12 rounded-[1.35rem] border border-white/80 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl lg:absolute lg:left-1/2 lg:bottom-0 lg:mt-0 lg:w-[calc(100%-2rem)] lg:max-w-6xl lg:-translate-x-1/2 lg:translate-y-1/2">
                <div className="grid gap-2 lg:grid-cols-[1fr_0.8fr_0.8fr_0.8fr_auto]">
                    <SearchFieldCard
                        field={searchFields[0]}
                        value={searchValues.destination}
                        onChange={(value) =>
                            setSearchValues((prev) => ({ ...prev, destination: value }))
                        }
                    />
                    <SearchFieldCard
                        field={{ label: "Check In", placeholder: "Start date", icon: "calendar" }}
                        value={searchValues.checkInDate}
                        onChange={(value) =>
                            setSearchValues((prev) => ({ ...prev, checkInDate: value }))
                        }
                    />
                    <SearchFieldCard
                        field={{ label: "Check Out", placeholder: "End date", icon: "calendar" }}
                        value={searchValues.checkOutDate}
                        onChange={(value) =>
                            setSearchValues((prev) => ({ ...prev, checkOutDate: value }))
                        }
                    />
                    <SearchFieldCard
                        field={searchFields[2]}
                        value={searchValues.guests}
                        onChange={(value) =>
                            setSearchValues((prev) => ({ ...prev, guests: value }))
                        }
                    />
                    <AppButton
                        type="submit"
                        variant="primary"
                        size="lg"
                        leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-white" />}
                        className="rounded-xl shadow-blue-700/25 lg:min-w-40"
                    >
                        {ctaLabel}
                    </AppButton>
                </div>
            </div>
        </form>
    );
}