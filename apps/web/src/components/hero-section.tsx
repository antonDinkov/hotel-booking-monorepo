import Image from "next/image";
import type { ReactNode } from "react";
import type { Hero } from "../types/hotel-panel";

interface HeroSectionProps {
  hero: Hero;
  id?: string;
  children?: ReactNode;
}

export function HeroSection({ hero, id = "top", children }: HeroSectionProps) {
  return (
    <section id={id} className="relative">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,20,48,0.52)_0%,rgba(12,20,48,0.25)_40%,rgba(12,20,48,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_35%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[620px] max-w-6xl flex-col justify-end px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:min-h-[680px] lg:pb-32 lg:pt-24">
        <div className="max-w-2xl text-white">
          <p className="mb-4 inline-flex rounded-full border border-white/30 bg-white/12 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-white/90">
            {hero.eyebrow}
          </p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight drop-shadow sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/88 sm:text-lg">
            {hero.description}
          </p>
        </div>

        {children}
      </div>
    </section>
  );
}