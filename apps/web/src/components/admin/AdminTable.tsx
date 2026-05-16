import type { AdminTableProps } from "@/types/admin";

export default function AdminTable<T>({
  rows,
  columns,
  getRowKey,
  emptyState,
}: AdminTableProps<T>) {
  if (rows.length === 0) {
    return (
      <>
        {emptyState ?? (
          <div className="rounded-[4px] border border-dashed border-slate-800 bg-slate-950 px-4 py-6 text-center text-xs text-slate-500">
            No records in this static scaffold section.
          </div>
        )}
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-[4px] border border-slate-800 bg-slate-950">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.header} className={["px-3 py-2 font-semibold", column.className ?? ""].join(" ")}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="transition hover:bg-slate-900/60">
                {columns.map((column) => (
                  <td
                    key={`${getRowKey(row)}-${column.header}`}
                    className={["px-3 py-3 align-top text-slate-300", column.cellClassName ?? ""].join(" ")}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
