"use client";

import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import type { SearchField } from "../types/hotel-panel";
import { AppButton } from "./AppButton";
import { SearchFieldCard } from "./SearchFieldCard";

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
    const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({
        destination: false,
        checkInDate: false,
        checkOutDate: false,
        guests: false,
    });

    const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        const destination = searchValues.destination.trim();
        const checkInDate = searchValues.checkInDate;
        const checkOutDate = searchValues.checkOutDate;
        const guests = searchValues.guests;

        const errors = {
            destination: destination.length === 0,
            checkInDate: checkInDate.length === 0,
            checkOutDate: checkOutDate.length === 0,
            guests: guests.length === 0,
        };

        setFieldErrors(errors);

        if (errors.destination || errors.checkInDate || errors.checkOutDate || errors.guests) {
            return;
        }

        if (onSearch) {
            onSearch({
                destination,
                checkInDate,
                checkOutDate,
                guests,
            });
        }
    };

    return (
        <form onSubmit={handleSearch}>
            <div className="w-full rounded-[1.35rem] border border-white/80 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
                <div className="grid gap-2 lg:grid-cols-[1fr_0.8fr_0.8fr_0.8fr_auto]">
                    <SearchFieldCard
                        field={searchFields[0]}
                        value={searchValues.destination}
                        error={fieldErrors.destination}
                        onChange={(value) => {
                            setSearchValues((prev) => ({ ...prev, destination: value }));
                            setFieldErrors((prev) => ({ ...prev, destination: false }));
                        }}
                    />
                    <SearchFieldCard
                        field={{ label: "Check In", placeholder: "Start date", icon: "calendar" }}
                        value={searchValues.checkInDate}
                        error={fieldErrors.checkInDate}
                        onChange={(value) => {
                            setSearchValues((prev) => ({ ...prev, checkInDate: value }));
                            setFieldErrors((prev) => ({ ...prev, checkInDate: false }));
                        }}
                    />
                    <SearchFieldCard
                        field={{ label: "Check Out", placeholder: "End date", icon: "calendar" }}
                        value={searchValues.checkOutDate}
                        error={fieldErrors.checkOutDate}
                        onChange={(value) => {
                            setSearchValues((prev) => ({ ...prev, checkOutDate: value }));
                            setFieldErrors((prev) => ({ ...prev, checkOutDate: false }));
                        }}
                    />
                    <SearchFieldCard
                        field={searchFields[2]}
                        value={searchValues.guests}
                        error={fieldErrors.guests}
                        onChange={(value) => {
                            setSearchValues((prev) => ({ ...prev, guests: value }));
                            setFieldErrors((prev) => ({ ...prev, guests: false }));
                        }}
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
