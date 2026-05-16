import type { PartnerSectionProps } from "@/types/partner";

export default function PartnerSection({
  title,
  description,
  actions,
  children,
  className,
}: PartnerSectionProps) {
  return (
    <section className={["space-y-4", className].filter(Boolean).join(" ")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
