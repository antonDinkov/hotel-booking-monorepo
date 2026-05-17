"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent } from "react";

import AdminFilters from "@/components/admin/AdminFilters";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import type { AdminTableColumn } from "@/types/admin";
import type {
  AdminReportChartPoint,
  AdminReportDistributionPoint,
  AdminReportFilters,
  AdminReportRankingItem,
  AdminReportsClientProps,
  AdminReportRange,
} from "@/types/admin-reports";

const rangeOptions: Array<{ label: string; value: AdminReportRange }> = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "last_7_days" },
  { label: "Last 30 days", value: "last_30_days" },
  { label: "Last 90 days", value: "last_90_days" },
  { label: "This year", value: "this_year" },
];

function reportsHref(filters: AdminReportFilters, range: AdminReportRange) {
  if (range !== "custom") return `/admin/reports?range=${range}`;

  const params = new URLSearchParams({
    range,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  return `/admin/reports?${params.toString()}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

function ChartCard({
  title,
  value,
  caption,
  points,
  tone = "bg-blue-500/45",
}: {
  title: string;
  value: string;
  caption: string;
  points: AdminReportChartPoint[];
  tone?: string;
}) {
  const max = Math.max(1, ...points.map((point) => point.value));

  return (
    <AdminPanel className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{caption}</p>
        </div>
        <AdminStatusBadge label="range" tone="blue" />
      </div>
      <div className="mt-6 flex h-36 items-end gap-1.5 border-b border-slate-800">
        {points.map((point) => (
          <div
            key={point.label}
            title={`${point.label}: ${point.value}`}
            className={`w-full ${tone}`}
            style={{ height: `${Math.max(4, (point.value / max) * 100)}%` }}
          />
        ))}
      </div>
    </AdminPanel>
  );
}

function DistributionPanel({
  title,
  items,
}: {
  title: string;
  items: AdminReportDistributionPoint[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <AdminPanel className="space-y-3 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{title}</p>
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-xs">
          <AdminStatusBadge label={item.label} tone={item.tone} />
          <div className="h-2 overflow-hidden rounded-[2px] bg-slate-900">
            <div
              className="h-full bg-blue-500/50"
              style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-slate-300">{formatNumber(item.value)}</span>
        </div>
      ))}
    </AdminPanel>
  );
}

export default function AdminReportsClient({ result }: AdminReportsClientProps) {
  const router = useRouter();

  function handleCustomRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const dateFrom = form.get("dateFrom")?.toString();
    const dateTo = form.get("dateTo")?.toString();
    const params = new URLSearchParams({ range: "custom" });

    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    router.push(`/admin/reports?${params.toString()}`);
  }

  const rankingColumns: AdminTableColumn<AdminReportRankingItem>[] = [
    {
      header: "Name",
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-100">{item.name}</span>
          <p className="mt-1 text-slate-500">{item.detail}</p>
        </div>
      ),
    },
    { header: "Value", render: (item) => formatNumber(item.value) },
  ];

  const revenueColumns: AdminTableColumn<AdminReportRankingItem>[] = [
    {
      header: "Partner",
      render: (item) => (
        <Link href={`/admin/partners/${item.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
          {item.name}
        </Link>
      ),
    },
    { header: "Revenue", render: (item) => formatCurrency(item.value) },
  ];

  return (
    <>
      <AdminFilters
        label="Range"
        filters={[
          ...rangeOptions.map((range) => ({
            label: range.label,
            href: reportsHref(result.filters, range.value),
            active: result.filters.range === range.value,
          })),
          {
            label: "Custom",
            href: reportsHref(result.filters, "custom"),
            active: result.filters.range === "custom",
            tone: "amber" as const,
          },
        ]}
      />

      <form onSubmit={handleCustomRange} className="grid gap-3 rounded-[4px] border border-slate-800 bg-slate-950 p-3 md:grid-cols-[repeat(2,minmax(0,180px))_auto]">
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          From
          <input name="dateFrom" type="date" defaultValue={result.filters.dateFrom} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          To
          <input name="dateTo" type="date" defaultValue={result.filters.dateTo} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <div className="flex items-end">
          <button type="submit" className="h-9 rounded-[3px] border border-blue-500/40 px-3 text-xs font-semibold uppercase tracking-wide text-blue-200 transition hover:bg-blue-500/10">
            Apply custom
          </button>
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {result.metrics.map((metric) => (
          <AdminStatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Revenue over time"
          value={formatCurrency(result.revenueOverTime.reduce((sum, point) => sum + point.value, 0))}
          caption={`${result.filters.dateFrom} to ${result.filters.dateTo}`}
          points={result.revenueOverTime}
        />
        <ChartCard
          title="Bookings over time"
          value={formatNumber(result.bookingsOverTime.reduce((sum, point) => sum + point.value, 0))}
          caption="Non-cancelled bookings created in range"
          points={result.bookingsOverTime}
          tone="bg-amber-500/50"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <DistributionPanel title="Booking status distribution" items={result.bookingStatusDistribution} />
        <DistributionPanel title="Partner verification distribution" items={result.partnerVerificationDistribution} />
        <DistributionPanel title="Review rating distribution" items={result.reviewRatingDistribution} />
      </div>

      <AdminSection title="Occupancy summary" description="Room nights booked divided by total available room nights for the selected range.">
        <AdminPanel className="grid gap-4 p-4 md:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-600">Average occupancy</p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">{percent(result.occupancySummary.averageRate)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-600">Booked room nights</p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">{formatNumber(result.occupancySummary.bookedRoomNights)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-600">Available room nights</p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">{formatNumber(result.occupancySummary.availableRoomNights)}</p>
          </div>
        </AdminPanel>
      </AdminSection>

      <ChartCard
        title="Occupancy trend"
        value={percent(result.occupancySummary.averageRate)}
        caption="Daily occupancy percentage"
        points={result.occupancySummary.daily}
        tone="bg-slate-600"
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSection title="Top hotels by bookings">
          <AdminTable rows={result.topHotelsByBookings} columns={rankingColumns} getRowKey={(item) => String(item.id)} />
        </AdminSection>
        <AdminSection title="Top partners by revenue">
          <AdminTable rows={result.topPartnersByRevenue} columns={revenueColumns} getRowKey={(item) => String(item.id)} />
        </AdminSection>
      </div>
    </>
  );
}
