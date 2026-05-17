"use client";

import {
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  StarIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useMemo,
  useState,
  useTransition,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";

import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerSection from "@/components/partner/PartnerSection";
import PartnerStatCard from "@/components/partner/PartnerStatCard";
import type { PartnerBadgeTone } from "@/types/partner";
import type {
  PartnerAnalyticsChartPoint,
  PartnerAnalyticsClientProps,
  PartnerAnalyticsDistributionPoint,
  PartnerAnalyticsFilters,
  PartnerAnalyticsRankingItem,
} from "@/types/partner-analytics";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const rangeLabels: Record<PartnerAnalyticsFilters["range"], string> = {
  today: "Today",
  last_7_days: "Last 7 days",
  last_30_days: "Last 30 days",
  last_90_days: "Last 90 days",
  this_year: "This year",
  custom: "Custom range",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const toneColors: Record<PartnerBadgeTone, string> = {
  amber: "#fcd34d",
  emerald: "#6ee7b7",
  indigo: "#a5b4fc",
  rose: "#fda4af",
  slate: "#cbd5e1",
};

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatPercent(value: number): string {
  return `${roundDisplay(value)}%`;
}

function formatRating(value: number | null): string {
  return value === null ? "New" : value.toFixed(2);
}

function roundDisplay(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function formatDateLabel(value: string): string {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" })
      .format(new Date(year, month - 1, 1));
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
    .format(new Date(year, month - 1, day));
}

function buildQueryPath(pathname: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function setOptionalParam(params: URLSearchParams, key: string, value?: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}

function MiniMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <PartnerCard>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </PartnerCard>
  );
}

function ChartCard({
  title,
  value,
  caption,
  points,
  isLoading,
  valueFormatter = formatNumber,
}: {
  title: string;
  value: string;
  caption: string;
  points: PartnerAnalyticsChartPoint[];
  isLoading: boolean;
  valueFormatter?: (value: number) => string;
}) {
  const max = Math.max(...points.map((point) => point.value), 0);
  const hasData = max > 0;

  return (
    <PartnerCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-300">{title}</h2>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{caption}</p>
        </div>
        {isLoading ? (
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
            Updating
          </span>
        ) : null}
      </div>

      {hasData ? (
        <>
          <div className={["mt-6 flex h-28 items-end gap-1 overflow-hidden", isLoading ? "opacity-60" : ""].join(" ")}>
            {points.map((point) => (
              <div
                key={`${title}-${point.label}`}
                title={`${formatDateLabel(point.label)}: ${valueFormatter(point.value)}`}
                className="min-w-[3px] flex-1 rounded-t bg-gradient-to-t from-indigo-500/50 via-emerald-400/50 to-amber-200/70"
                style={{ height: `${Math.max((point.value / max) * 100, 4)}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between gap-3 text-[11px] text-slate-500">
            <span>{formatDateLabel(points[0]?.label ?? "")}</span>
            <span>{formatDateLabel(points[points.length - 1]?.label ?? "")}</span>
          </div>
        </>
      ) : (
        <div className="mt-6 flex h-28 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sm text-slate-500">
          No data for selected filters
        </div>
      )}
    </PartnerCard>
  );
}

function DonutChartCard({
  title,
  value,
  caption,
  items,
  isLoading,
}: {
  title: string;
  value: string;
  caption: string;
  items: PartnerAnalyticsDistributionPoint[];
  isLoading: boolean;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const circumference = 2 * Math.PI * 42;
  const segments = items.reduce<{
    offset: number;
    values: Array<{ item: PartnerAnalyticsDistributionPoint; length: number; offset: number }>;
  }>(
    (result, item) => {
      const length = total > 0 ? (item.value / total) * circumference : 0;
      return {
        offset: result.offset + length,
        values: [...result.values, { item, length, offset: result.offset }],
      };
    },
    { offset: 0, values: [] }
  ).values;

  return (
    <PartnerCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-300">{title}</h2>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{caption}</p>
        </div>
        {isLoading ? (
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
            Updating
          </span>
        ) : null}
      </div>

      {total > 0 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
          <svg viewBox="0 0 100 100" className={["h-32 w-32", isLoading ? "opacity-60" : ""].join(" ")}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
            {segments.map(({ item, length, offset }) => (
                <circle
                  key={item.label}
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={toneColors[item.tone]}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  strokeWidth="12"
                  transform="rotate(-90 50 50)"
                />
            ))}
          </svg>
          <div className="grid gap-2">
            {items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                <PartnerBadge tone={item.tone}>{statusLabels[item.label] ?? item.label}</PartnerBadge>
                <span className="font-semibold text-slate-200">{formatNumber(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 flex h-32 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sm text-slate-500">
          No data for selected filters
        </div>
      )}
    </PartnerCard>
  );
}

function RankingList({
  title,
  items,
  formatter = formatNumber,
}: {
  title: string;
  items: PartnerAnalyticsRankingItem[];
  formatter?: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => item.value), 0);

  return (
    <PartnerCard>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {items.length ? (
        <div className="mt-5 grid gap-4">
          {items.map((item) => (
            <div key={`${title}-${item.id}`}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{item.name}</p>
                  {item.detail ? <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p> : null}
                </div>
                <span className="shrink-0 font-semibold text-slate-200">{formatter(item.value)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-indigo-400 via-emerald-300 to-amber-200"
                  style={{ width: max > 0 ? `${Math.max((item.value / max) * 100, 4)}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex h-24 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sm text-slate-500">
          No data for selected filters
        </div>
      )}
    </PartnerCard>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-medium text-slate-100 outline-none transition hover:bg-slate-900 focus:border-amber-300/40 disabled:cursor-wait disabled:opacity-70"
      >
        {children}
      </select>
    </label>
  );
}

function DateInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-medium text-slate-100 outline-none transition hover:bg-slate-900 focus:border-amber-300/40 disabled:cursor-wait disabled:opacity-70"
      />
    </label>
  );
}

function useAnalyticsNavigation(filters: PartnerAnalyticsFilters) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilters(updates: Partial<Record<keyof PartnerAnalyticsFilters, string | undefined>>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      setOptionalParam(params, key, value);
    }

    if (updates.range && updates.range !== "custom") {
      params.delete("dateFrom");
      params.delete("dateTo");
    }

    startTransition(() => router.push(buildQueryPath(pathname, params)));
  }

  return { filters, isPending, updateFilters };
}

function AnalyticsFilters({ initialResult, isPending, updateFilters }: {
  initialResult: PartnerAnalyticsClientProps["initialResult"];
  isPending: boolean;
  updateFilters: (updates: Partial<Record<keyof PartnerAnalyticsFilters, string | undefined>>) => void;
}) {
  const { filters, options } = initialResult;
  const [dateDraft, setDateDraft] = useState({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  const roomTypes = useMemo(
    () => options.roomTypes.filter((room) => !filters.hotelId || room.hotelId === filters.hotelId),
    [filters.hotelId, options.roomTypes]
  );

  return (
    <PartnerCard>
      <div className="grid gap-4 lg:grid-cols-4">
        <FilterSelect
          label="Date range"
          value={filters.range}
          disabled={isPending}
          onChange={(range) => updateFilters({
            range,
            dateFrom: range === "custom" ? filters.dateFrom : undefined,
            dateTo: range === "custom" ? filters.dateTo : undefined,
          })}
        >
          {Object.entries(rangeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Hotel"
          value={filters.hotelId?.toString() ?? "all"}
          disabled={isPending}
          onChange={(hotelId) => updateFilters({
            hotelId: hotelId === "all" ? undefined : hotelId,
            roomTypeId: undefined,
          })}
        >
          <option value="all">All hotels</option>
          {options.hotels.map((hotel) => (
            <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Room type"
          value={filters.roomTypeId?.toString() ?? "all"}
          disabled={isPending}
          onChange={(roomTypeId) => updateFilters({
            roomTypeId: roomTypeId === "all" ? undefined : roomTypeId,
          })}
        >
          <option value="all">All room types</option>
          {roomTypes.map((room) => (
            <option key={room.id} value={room.id}>
              {room.hotelName} - {room.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Booking status"
          value={filters.status ?? "all"}
          disabled={isPending}
          onChange={(status) => updateFilters({ status: status === "all" ? undefined : status })}
        >
          <option value="all">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </FilterSelect>
      </div>

      {filters.range === "custom" ? (
        <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <DateInput
            label="Start date"
            value={dateDraft.dateFrom}
            disabled={isPending}
            onChange={(dateFrom) => setDateDraft((current) => ({ ...current, dateFrom }))}
          />
          <DateInput
            label="End date"
            value={dateDraft.dateTo}
            disabled={isPending}
            onChange={(dateTo) => setDateDraft((current) => ({ ...current, dateTo }))}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => updateFilters({ range: "custom", ...dateDraft })}
            className="h-11 rounded-lg bg-amber-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"
          >
            Apply
          </button>
        </div>
      ) : null}
    </PartnerCard>
  );
}

function SummaryCards({ initialResult }: PartnerAnalyticsClientProps) {
  const { summary } = initialResult;
  const cards: Array<{
    label: string;
    value: string;
    detail: string;
    tone: PartnerBadgeTone;
    icon: IconComponent;
  }> = [
    { label: "Total bookings", value: formatNumber(summary.totalBookings), detail: "Selected range", tone: "indigo", icon: ClipboardDocumentListIcon },
    { label: "Total revenue", value: formatCurrency(summary.totalRevenue), detail: "Paid confirmed stays", tone: "emerald", icon: BanknotesIcon },
    { label: "Average occupancy", value: formatPercent(summary.averageOccupancyRate), detail: "Booked room nights", tone: "amber", icon: CalendarDaysIcon },
    { label: "Average rating", value: formatRating(summary.averageReviewRating), detail: "Published reviews", tone: "amber", icon: StarIcon },
    { label: "Total reviews", value: formatNumber(summary.totalReviews), detail: "Published feedback", tone: "slate", icon: ChatBubbleLeftRightIcon },
    { label: "Pending bookings", value: formatNumber(summary.pendingBookings), detail: "Awaiting action", tone: "amber", icon: ClockIcon },
    { label: "Cancelled bookings", value: formatNumber(summary.cancelledBookings), detail: "Selected range", tone: "rose", icon: XCircleIcon },
    { label: "Completed bookings", value: formatNumber(summary.completedBookings), detail: "Finished stays", tone: "emerald", icon: CheckCircleIcon },
    { label: "Active hotels", value: formatNumber(summary.activeHotels), detail: "Owned portfolio", tone: "slate", icon: BuildingOffice2Icon },
    { label: "Room inventory", value: formatNumber(summary.totalRoomInventory), detail: "Rooms across room types", tone: "indigo", icon: ChartBarIcon },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <PartnerStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            detail={card.detail}
            tone={card.tone}
            icon={<Icon className="h-5 w-5" aria-hidden="true" />}
          />
        );
      })}
    </div>
  );
}

export default function PartnerAnalyticsClient({ initialResult }: PartnerAnalyticsClientProps) {
  const { isPending, updateFilters } = useAnalyticsNavigation(initialResult.filters);
  const { revenue, bookings, occupancy, reviews } = initialResult;

  return (
    <div className="space-y-8">
      <AnalyticsFilters
        initialResult={initialResult}
        isPending={isPending}
        updateFilters={updateFilters}
      />

      <SummaryCards initialResult={initialResult} />

      <PartnerSection title="Revenue analytics" description="Paid revenue from confirmed and completed bookings.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniMetric label="Today" value={formatCurrency(revenue.today)} detail="Paid room nights" />
          <MiniMetric label="This week" value={formatCurrency(revenue.thisWeek)} detail="Week to date" />
          <MiniMetric label="This month" value={formatCurrency(revenue.thisMonth)} detail="Month to date" />
          <MiniMetric label="This year" value={formatCurrency(revenue.thisYear)} detail="Year to date" />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <ChartCard title="Daily revenue" value={formatCurrency(revenue.total)} caption="Selected range" points={revenue.daily} isLoading={isPending} valueFormatter={formatCurrency} />
          <ChartCard title="Weekly revenue" value={formatCurrency(revenue.total)} caption="Grouped by week" points={revenue.weekly} isLoading={isPending} valueFormatter={formatCurrency} />
          <ChartCard title="Monthly revenue" value={formatCurrency(revenue.total)} caption="Grouped by month" points={revenue.monthly} isLoading={isPending} valueFormatter={formatCurrency} />
        </div>
      </PartnerSection>

      <PartnerSection title="Booking analytics" description="Reservations grouped by status, hotel, room type, and booking date.">
        <div className="grid gap-5 lg:grid-cols-3">
          <ChartCard title="Bookings timeline" value={formatNumber(bookings.daily.reduce((sum, point) => sum + point.value, 0))} caption="Non-cancelled unless filtered" points={bookings.daily} isLoading={isPending} />
          <DonutChartCard title="Booking status" value={formatNumber(bookings.statusDistribution.reduce((sum, item) => sum + item.value, 0))} caption="Status distribution" items={bookings.statusDistribution} isLoading={isPending} />
          <ChartCard title="Monthly bookings" value={formatNumber(bookings.monthly.reduce((sum, point) => sum + point.value, 0))} caption="Grouped by month" points={bookings.monthly} isLoading={isPending} />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <RankingList title="Top booked hotels" items={bookings.byHotel} />
          <RankingList title="Bookings by room type" items={bookings.byRoomType} />
        </div>
      </PartnerSection>

      <PartnerSection title="Occupancy analytics" description="Booked room nights divided by available room nights.">
        <div className="grid gap-5 lg:grid-cols-3">
          <ChartCard title="Occupancy trend" value={formatPercent(occupancy.averageRate)} caption="Daily portfolio rate" points={occupancy.trend} isLoading={isPending} valueFormatter={formatPercent} />
          <RankingList title="Most occupied hotels" items={occupancy.mostOccupiedHotels} formatter={formatPercent} />
          <RankingList title="Least occupied hotels" items={occupancy.leastOccupiedHotels} formatter={formatPercent} />
        </div>
        <div className="mt-5">
          <RankingList title="Occupancy by room type" items={occupancy.byRoomType} formatter={formatPercent} />
        </div>
      </PartnerSection>

      <PartnerSection title="Review analytics" description="Published guest reviews only.">
        <div className="grid gap-5 lg:grid-cols-3">
          <ChartCard title="Reviews trend" value={formatNumber(reviews.totalReviews)} caption="Published reviews by day" points={reviews.trend} isLoading={isPending} />
          <DonutChartCard title="Rating distribution" value={formatRating(reviews.averageRating)} caption="Average rating" items={reviews.ratingDistribution} isLoading={isPending} />
          <RankingList title="Best rated hotels" items={reviews.bestRatedHotels} formatter={(value) => value.toFixed(2)} />
        </div>
        <div className="mt-5">
          <RankingList title="Lowest rated hotels" items={reviews.lowestRatedHotels} formatter={(value) => value.toFixed(2)} />
        </div>
      </PartnerSection>
    </div>
  );
}
