import type { AdminPanelProps } from "@/types/admin";

export default function AdminPanel({ children, className = "" }: AdminPanelProps) {
  return (
    <div
      className={[
        "border border-slate-800 bg-slate-950 shadow-sm shadow-black/20",
        "rounded-[4px]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
