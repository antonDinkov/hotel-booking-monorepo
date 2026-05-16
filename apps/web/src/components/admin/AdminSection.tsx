import type { AdminSectionProps } from "@/types/admin";

export default function AdminSection({
  title,
  description,
  actions,
  children,
  className = "",
}: AdminSectionProps) {
  return (
    <section className={["space-y-3", className].join(" ")}>
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
