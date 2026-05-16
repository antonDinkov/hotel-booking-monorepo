import type { PartnerCardProps } from "@/types/partner";

export default function PartnerCard({ children, className }: PartnerCardProps) {
  return (
    <div
      className={[
        "rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/20 backdrop-blur-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
