import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import {
  partnerCalendarDates,
  partnerCalendarRows,
} from "@/lib/partner-mock-data";

export default function Page() {
  return (
    <>
      <PartnerPageHeader
        eyebrow="Availability"
        title="Calendar"
        description="A static room-by-date availability grid with visual occupancy blocks."
      />

      <PartnerCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[220px_repeat(7,minmax(92px,1fr))] border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-[0.14em] text-slate-500">
              <div className="px-4 py-3 font-semibold">Room</div>
              {partnerCalendarDates.map((date) => (
                <div key={date} className="border-l border-white/10 px-3 py-3 font-semibold">
                  {date}
                </div>
              ))}
            </div>
            {partnerCalendarRows.map((row) => (
              <div
                key={`${row.hotel}-${row.room}`}
                className="grid grid-cols-[220px_repeat(7,minmax(92px,1fr))] border-b border-white/10 last:border-b-0"
              >
                <div className="px-4 py-4">
                  <p className="font-semibold text-white">{row.room}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.hotel}</p>
                </div>
                {partnerCalendarDates.map((date, index) => {
                  const block = row.blocks.find(
                    (item) => index >= item.start && index < item.start + item.span
                  );
                  const startsHere = block?.start === index;

                  return (
                    <div
                      key={`${row.room}-${date}`}
                      className="min-h-20 border-l border-white/10 p-2"
                    >
                      {block && startsHere ? (
                        <div
                          className="h-full rounded-lg border border-white/10 bg-white/[0.06] p-2"
                          style={{ width: `calc(${block.span * 100}% + ${(block.span - 1) * 0.5}rem)` }}
                        >
                          <PartnerBadge tone={block.tone}>{block.label}</PartnerBadge>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </PartnerCard>
    </>
  );
}
