"use client";

/* eslint-disable @next/next/no-img-element -- upload previews use blob URLs, which next/image cannot optimize. */

import {
  ArrowDownIcon,
  ArrowUpIcon,
  PhotoIcon,
  StarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

import type { PartnerImageDraft, PartnerImageManagerProps } from "@/types/partner-hotel";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/60";

function createClientId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function normalizeImages(images: PartnerImageDraft[]): PartnerImageDraft[] {
  const coverIndex = images.findIndex((image) => image.isCover);
  const resolvedCoverIndex = coverIndex >= 0 ? coverIndex : 0;

  return images.map((image, index) => ({
    ...image,
    sortOrder: index,
    isCover: images.length > 0 && index === resolvedCoverIndex,
  }));
}

function reorderImage(
  images: PartnerImageDraft[],
  index: number,
  direction: -1 | 1
): PartnerImageDraft[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= images.length) return images;

  const nextImages = [...images];
  const [image] = nextImages.splice(index, 1);
  nextImages.splice(targetIndex, 0, image);

  return normalizeImages(nextImages);
}

export default function PartnerImageManager({
  label,
  images,
  onChange,
  fileInputId,
}: PartnerImageManagerProps) {
  const [imageUrl, setImageUrl] = useState("");

  const updateImages = (nextImages: PartnerImageDraft[]) => {
    onChange(normalizeImages(nextImages));
  };

  const addUrlImage = () => {
    const url = imageUrl.trim();
    if (!url) return;

    updateImages([
      ...images,
      {
        clientId: createClientId(),
        source: "url",
        imageKey: url,
        imageUrl: url,
        sortOrder: images.length,
        isCover: images.length === 0,
      },
    ]);
    setImageUrl("");
  };

  const addFileImages = (files: FileList | null) => {
    if (!files?.length) return;

    const drafts = Array.from(files).map((file, index) => ({
      clientId: createClientId(),
      source: "file" as const,
      imageUrl: URL.createObjectURL(file),
      file,
      sortOrder: images.length + index,
      isCover: images.length === 0 && index === 0,
    }));

    updateImages([...images, ...drafts]);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <input
          className={inputClass}
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://example.com/hotel-image.jpg"
          aria-label={`${label} image URL`}
        />
        <button
          type="button"
          onClick={addUrlImage}
          className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15"
        >
          Add URL
        </button>
      </div>

      <label
        htmlFor={fileInputId}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.04] px-4 py-5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07]"
      >
        <PhotoIcon className="h-5 w-5" aria-hidden="true" />
        Upload {label.toLowerCase()} images
      </label>
      <input
        id={fileInputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        onChange={(event) => addFileImages(event.target.files)}
      />

      {images.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.clientId}
              className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/40"
            >
              <div className="relative aspect-[4/3] bg-white/[0.04]">
                <img
                  src={image.imageUrl}
                  alt={`${label} image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {image.isCover ? (
                  <span className="absolute left-2 top-2 rounded-full bg-amber-300 px-2.5 py-1 text-xs font-semibold text-slate-950">
                    Cover
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-4 gap-1 p-2">
                <button
                  type="button"
                  onClick={() => updateImages(images.map((item) => ({
                    ...item,
                    isCover: item.clientId === image.clientId,
                  })))}
                  className="rounded-md border border-white/10 p-2 text-slate-200 transition hover:bg-white/[0.06]"
                  aria-label="Set cover image"
                >
                  <StarIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => updateImages(reorderImage(images, index, -1))}
                  className="rounded-md border border-white/10 p-2 text-slate-200 transition hover:bg-white/[0.06]"
                  aria-label="Move image up"
                >
                  <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => updateImages(reorderImage(images, index, 1))}
                  className="rounded-md border border-white/10 p-2 text-slate-200 transition hover:bg-white/[0.06]"
                  aria-label="Move image down"
                >
                  <ArrowDownIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => updateImages(images.filter((item) => item.clientId !== image.clientId))}
                  className="rounded-md border border-rose-300/20 p-2 text-rose-200 transition hover:bg-rose-300/10"
                  aria-label="Remove image"
                >
                  <TrashIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex aspect-[4/1] min-h-36 items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.04] text-slate-400">
          <PhotoIcon className="h-8 w-8" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
