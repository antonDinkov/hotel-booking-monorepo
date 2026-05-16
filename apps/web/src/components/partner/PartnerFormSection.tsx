import type { PartnerFormSectionProps } from "@/types/partner";
import PartnerCard from "./PartnerCard";

export default function PartnerFormSection({
  title,
  description,
  children,
}: PartnerFormSectionProps) {
  return (
    <PartnerCard className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </PartnerCard>
  );
}
