import PartnerChartPlaceholder from "@/components/partner/PartnerChartPlaceholder";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import { partnerAnalyticsMetrics } from "@/lib/partner-mock-data";

export default function Page() {
  return (
    <>
      <PartnerPageHeader
        eyebrow="Performance preview"
        title="Analytics"
        description="Simple visual analytics placeholders for bookings, revenue, occupancy, hotel performance, cancellations, and ratings."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {partnerAnalyticsMetrics.map((metric) => (
          <PartnerChartPlaceholder
            key={metric.title}
            title={metric.title}
            value={metric.value}
            caption={metric.caption}
            bars={metric.bars}
          />
        ))}
      </div>
    </>
  );
}
