"use client";

import { useRef, useState } from "react";

interface ProfileAvatarProps {
    targetWidth?: number;
    initialSrc?: string;
    onFileChange?: (file: File | null) => void;
    onRemove?: () => Promise<void> | void;
    isRemoving?: boolean;
}

export default function ProfileAvatar({ targetWidth = 40, initialSrc, onFileChange, onRemove, isRemoving }: ProfileAvatarProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string | undefined>(() => initialSrc);
    const [isRemovingLocal, setIsRemovingLocal] = useState(false);

    const handleButtonClick = () => inputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) {
            if (onFileChange) onFileChange(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setPreview(String(reader.result));
        reader.readAsDataURL(file);
        if (onFileChange) onFileChange(file);
    };

    const handleRemoveClick = async () => {
        const old = preview;
        setPreview(undefined);
        try {
            if (onRemove) {
                if (!isRemoving) setIsRemovingLocal(true);
                await onRemove();
            }
        } catch (err) {
            // revert preview on failure
            setPreview(old);
            throw err;
        } finally {
            setIsRemovingLocal(false);
        }
    };

    const sizeStyle = { width: targetWidth, height: targetWidth };

    return (
        <div className="flex items-center gap-3">
            <div
                className="overflow-hidden rounded-full border border-slate-200 bg-white"
                style={sizeStyle}
                aria-hidden
            >
                {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 p-2 text-xs text-slate-500">
                        No Image
                    </div>
                )}
            </div>

            <div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleButtonClick}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Change
                    </button>
                    {preview ? (
                        <button
                            type="button"
                            onClick={handleRemoveClick}
                            disabled={isRemovingLocal || isRemoving}
                            className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                            {isRemoving || isRemovingLocal ? "Removing..." : "Remove"}
                        </button>
                    ) : null}
                </div>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
        </div>
    );
}
