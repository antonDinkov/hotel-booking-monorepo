"use client";

import Image from "next/image";

interface HotelImageProps {
  images?: string[];
  alt?: string;
}

export default function HotelImage({ images = [], alt = "" }: HotelImageProps) {
  const src = images[0];
  if (!src) {
    return <div className="w-full h-full bg-slate-100" />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover w-full h-full"
      sizes="(max-width: 640px) 100vw, 33vw"
    />
  );
}
