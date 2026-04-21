"use client";

import Image from "next/image";
import { useState } from "react";

type HotelImageProps = {
  images: string[];
  alt: string;
  className?: string;
};

export default function HotelImage({ images, alt, className }: HotelImageProps) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(0);

  if (!images || images.length === 0 || failed >= images.length) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-500 ${className ?? ""}`}>
        Image unavailable
      </div>
    );
  }

  return (
    <Image
      src={images[index]}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
      className={`object-cover transition duration-500 group-hover:scale-105 ${className ?? ""}`}
      onError={() => {
        setFailed((prev) => prev + 1);
        setIndex((prev) => prev + 1);
      }}
    />
  );
}