"use client";

import { useState, useEffect } from "react";
import type { InputType } from "@/types/profile";

interface ProfileFieldProps {
    label: string;
    value?: string;
    inputType: InputType;
    options?: string[];
    placeholder?: string;
    onSave: (value: string) => void;
    onCancel?: () => void;
    saved?: boolean;
    isEditable?: boolean;
}

export default function ProfileField({
    label,
    value,
    inputType,
    options,
    placeholder,
    onSave,
    onCancel,
    saved,
    isEditable
}: ProfileFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value ?? "");
    const canEdit = isEditable ?? true;

    useEffect(() => {
        setTempValue(value ?? "");
    }, [value]);

    const startEditing = () => {
        if (!canEdit) return;
        setTempValue(value ?? "");
        setIsEditing(true);
    };

    const cancel = () => {
        setTempValue(value ?? "");
        setIsEditing(false);
        if (onCancel) onCancel();
    };

    const save = () => {
        onSave(tempValue);
        setIsEditing(false);
    };

    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700">{label}</label>
                    <p className="mt-1 text-sm text-slate-900">{(value ?? "").trim().length ? value : "Not set"}</p>
                </div>
                {!isEditing && (
                    <button
                        type="button"
                        onClick={canEdit ? startEditing : undefined}
                        disabled={!canEdit}
                        aria-disabled={!canEdit}
                        className={canEdit
                            ? "text-xs font-semibold text-blue-600 hover:text-blue-700"
                            : "text-xs font-semibold text-slate-400 cursor-not-allowed"
                        }
                    >
                        Change
                    </button>
                )}
            </div>

            {isEditing && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                            {inputType === "select" ? (
                                <select
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                                >
                                    {(options ?? []).map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={inputType}
                                    value={tempValue}
                                    placeholder={placeholder}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={save}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={cancel}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {saved && !isEditing && (
                <p className="mt-2 text-xs font-medium text-emerald-600">Your data has been saved</p>
            )}
        </div>
    );
}

