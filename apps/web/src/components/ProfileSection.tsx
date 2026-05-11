"use client";

import type { ProfileSectionProps } from "@/types/profile";

export default function ProfileSection({ title, children }: ProfileSectionProps) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="block text-sm font-medium text-slate-700">{title}</h3>
                </div>
            </div>
            <div className="mt-3">{children}</div>
        </div>
    );
}
