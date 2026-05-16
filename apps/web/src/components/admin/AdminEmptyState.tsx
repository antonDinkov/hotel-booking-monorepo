import type { AdminEmptyStateProps } from "@/types/admin";

export default function AdminEmptyState({
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="border border-dashed border-slate-800 bg-slate-950 px-4 py-8 text-center">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-500">
        {description}
      </p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
