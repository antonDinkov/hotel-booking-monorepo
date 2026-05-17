import type {
  AdminReportDistributionPoint,
  AdminReportsResult,
} from "@/types/admin-reports";

export type AdminAnalyticsResult = AdminReportsResult & {
  paymentStatusDistribution: AdminReportDistributionPoint[];
};

export type AdminAnalyticsClientProps = {
  result: AdminAnalyticsResult;
};
