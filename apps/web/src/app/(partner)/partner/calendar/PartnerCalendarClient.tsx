"use client";

import { CalendarDaysIcon, FunnelIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only";
import type { PartnerBadgeTone } from "@/types/partner";
import type {
  PartnerCalendarAvailabilityCell,
  PartnerCalendarClientProps,
  PartnerCalendarEvent,
} from "@/types/partner-calendar";

const statusOptions = [
  { label: "All bookings", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
] as const;

const viewOptions = [
  { label: "Month", value: "monthly" },
  { label: "Week", value: "weekly" },
] as const;

function addDays(value: string, days: number): string {
  const date = parseDateOnly(value);
  date.setDate(date.getDate() + days);
  return formatDateOnly(date);
}

function getMonthRange(value: string) {
  const date = parseDateOnly(value);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    dateFrom: formatDateOnly(start),
    dateTo: formatDateOnly(end),
  };
}

function getViewRange(nextView: "monthly" | "weekly", currentDateFrom: string) {
  if (nextView === "weekly") {
    return {
      dateFrom: currentDateFrom,
      dateTo: addDays(currentDateFrom, 6),
    };
  }

  return getMonthRange(currentDateFrom);
}

function formatHeaderDate(value: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(parseDateOnly(value));
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(status: string): PartnerBadgeTone {
  if (status === "confirmed") return "emerald";
  if (status === "pending") return "amber";
  if (status === "cancelled") return "rose";
  if (status === "completed") return "slate";
  return "indigo";
}

function availabilityClasses(cell: PartnerCalendarAvailabilityCell): string {
  if (cell.status === "full") return "bg-rose-300/10 text-rose-100";
  if (cell.status === "partial") return "bg-amber-300/10 text-amber-100";
  return "bg-emerald-300/5 text-emerald-100";
}

function buildCalendarPath(values: Record<string, string>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (!value || value === "all") continue;
    params.set(key, value);
  }

  const query = params.toString();
  return query ? `/partner/calendar?${query}` : "/partner/calendar";
}

function getEventPlacement(event: PartnerCalendarEvent, dates: string[]) {
  const firstDate = dates[0];
  const rangeEnd = addDays(dates[dates.length - 1], 1);
  const startDate = event.checkInDate <= firstDate ? firstDate : event.checkInDate;
  const endDate = event.checkOutDate >= rangeEnd ? rangeEnd : event.checkOutDate;
  const start = dates.indexOf(startDate);
  const end = dates.findIndex((date) => date >= endDate);

  return {
    start: Math.max(start, 0),
    span: Math.max(1, (end === -1 ? dates.length : end) - Math.max(start, 0)),
  };
}

export default function PartnerCalendarClient({ initialResult }: PartnerCalendarClientProps) {
  const router = useRouter();
  const calendarScrollRef = useRef<HTMLDivElement | null>(null);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null);
  const isSyncingScroll = useRef(false);
  const [view, setView] = useState(initialResult.filters.view);
  const [hotelId, setHotelId] = useState(initialResult.filters.hotelId?.toString() ?? "all");
  const [roomTypeId, setRoomTypeId] = useState(initialResult.filters.roomTypeId?.toString() ?? "all");
  const [status, setStatus] = useState(initialResult.filters.status ?? "all");
  const [dateFrom, setDateFrom] = useState(initialResult.filters.dateFrom);
  const [dateTo, setDateTo] = useState(initialResult.filters.dateTo);
  const gridMinWidth = 220 + initialResult.dates.length * 92;

  const applyFilters = () => {
    router.push(buildCalendarPath({ view, hotelId, roomTypeId, status, dateFrom, dateTo }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters();
  };

  const switchView = (nextView: typeof view) => {
    const range = getViewRange(nextView, dateFrom);
    setView(nextView);
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    router.push(buildCalendarPath({ view: nextView, hotelId, roomTypeId, status, ...range }));
  };

  const syncHorizontalScroll = (source: HTMLDivElement | null, target: HTMLDivElement | null) => {
    if (!source || !target || isSyncingScroll.current) return;

    isSyncingScroll.current = true;
    target.scrollLeft = source.scrollLeft;
    window.requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const gridStyle = {
    gridTemplateColumns: `220px repeat(${initialResult.dates.length}, minmax(92px, 1fr))`,
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {viewOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => switchView(option.value)}
            className={[
              "rounded-lg border px-4 py-2 text-sm font-semibold transition",
              view === option.value
                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                : "border-white/10 text-slate-300 hover:bg-white/[0.06]",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>

      <PartnerCard>
        <form className="grid gap-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]" onSubmit={handleSubmit}>
          <select value={hotelId} onChange={(event) => setHotelId(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40">
            <option value="all">All hotels</option>
            {initialResult.hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
            ))}
          </select>
          <select value={roomTypeId} onChange={(event) => setRoomTypeId(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40">
            <option value="all">All room types</option>
            {initialResult.roomTypes.map((roomType) => (
              <option key={roomType.id} value={roomType.id}>{roomType.hotelName} - {roomType.name}</option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40">
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40" aria-label="Calendar date from" />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40" aria-label="Calendar date to" />
          <div className="flex gap-2">
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200">
              <FunnelIcon className="h-4 w-4" aria-hidden="true" />
              Apply
            </button>
            <Link href="/partner/calendar" className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]">
              Reset
            </Link>
          </div>
        </form>
      </PartnerCard>

      <PartnerCard className="overflow-visible p-0">
        <div
          ref={calendarScrollRef}
          className="overflow-x-auto"
          onScroll={() => syncHorizontalScroll(calendarScrollRef.current, bottomScrollRef.current)}
        >
          <div style={{ minWidth: `${gridMinWidth}px` }}>
            <div className="grid border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-[0.14em] text-slate-500" style={gridStyle}>
              <div className="sticky left-0 z-20 bg-slate-950/95 px-4 py-3 font-semibold shadow-[8px_0_18px_rgba(2,6,23,0.35)]">
                Room
              </div>
              {initialResult.dates.map((date) => (
                <div key={date} className="border-l border-white/10 px-3 py-3 font-semibold">
                  {formatHeaderDate(date)}
                </div>
              ))}
            </div>

            {initialResult.rows.map((row) => (
              <div key={row.roomTypeId} className="grid border-b border-white/10 last:border-b-0" style={gridStyle}>
                <div className="sticky left-0 z-10 bg-slate-950/95 px-4 py-4 shadow-[8px_0_18px_rgba(2,6,23,0.35)]">
                  <p className="font-semibold text-white">{row.roomTypeName}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.hotelName}</p>
                  <p className="mt-2 text-xs text-slate-400">{row.totalRooms} total rooms</p>
                </div>
                {initialResult.dates.map((date, index) => {
                  const cell = row.availability.find((item) => item.date === date);
                  const startingEvents = row.events.filter((event) => getEventPlacement(event, initialResult.dates).start === index);

                  return (
                    <div key={`${row.roomTypeId}-${date}`} className="min-h-28 border-l border-white/10 p-2">
                      {cell ? (
                        <div className={["mb-2 rounded-md px-2 py-1 text-[11px] font-semibold", availabilityClasses(cell)].join(" ")}>
                          {cell.availableRooms} open
                        </div>
                      ) : null}
                      <div className="space-y-1">
                        {startingEvents.map((event) => {
                          const placement = getEventPlacement(event, initialResult.dates);

                          return (
                            <Link
                              key={event.bookingId}
                              href={`/partner/bookings/${event.bookingId}`}
                              className="block rounded-lg border border-white/10 bg-white/[0.06] p-2 transition hover:border-amber-300/30 hover:bg-white/[0.09]"
                              style={{ width: `calc(${placement.span * 100}% + ${(placement.span - 1) * 0.5}rem)` }}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <PartnerBadge tone={statusTone(event.status)}>{formatLabel(event.status)}</PartnerBadge>
                                <span className="truncate text-xs font-semibold text-white">#{event.bookingId}</span>
                              </div>
                              <p className="mt-2 truncate text-xs font-semibold text-slate-100">{event.guestFullName}</p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {event.guestsCount} guest{event.guestsCount === 1 ? "" : "s"} - {event.roomsCount} room{event.roomsCount === 1 ? "" : "s"}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {initialResult.rows.length > 0 ? (
          <div className="sticky bottom-0 z-30 border-t border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur">
            <div
              ref={bottomScrollRef}
              className="overflow-x-auto"
              onScroll={() => syncHorizontalScroll(bottomScrollRef.current, calendarScrollRef.current)}
              aria-label="Calendar horizontal scroll"
            >
              <div className="h-3" style={{ width: `${gridMinWidth}px` }} />
            </div>
          </div>
        ) : null}

        {initialResult.rows.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <CalendarDaysIcon className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
            <p className="mt-3 font-semibold text-white">No calendar rows found</p>
            <p className="mt-2 text-sm text-slate-400">Add room types or adjust the current filters.</p>
          </div>
        ) : null}
      </PartnerCard>
    </>
  );
}
