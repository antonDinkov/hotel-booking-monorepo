import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import ListingResultCard from '@/components/ListingResultCard';
import ScreenContainer from '@/components/ScreenContainer';
import SearchPanel from '@/components/SearchPanel';
import { getClientBookingsPage, getFavoriteHotelIds, getHotelPanelData, getMyReviewsCount } from '@/lib/clientApi';
import type { ClientBookingsPage } from '@/types/booking';
import type { HotelPanelData } from '@/types/hotel-panel';

type DashboardState = {
  bookingsPage: ClientBookingsPage | null;
  favoriteHotelIds: number[];
  panelData: HotelPanelData | null;
  reviewsCount: number;
};

export default function Dashboard() {
  const [state, setState] = useState<DashboardState>({
    bookingsPage: null,
    favoriteHotelIds: [],
    panelData: null,
    reviewsCount: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadDashboard().then((result) => {
      if (!mounted) return;
      setState(result.state);
      setError(result.error);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const upcomingTripsCount = getUpcomingTripsCount(state.bookingsPage);
  const footerContent = (
    <View style={styles.footerContent}>
      {isLoading ? <ActivityIndicator color="#2563eb" size="large" /> : null}
      {error ? <Text style={styles.errorBox}>{error}</Text> : null}

      <View style={styles.stats}>
        <Metric label="Upcoming Trips" value={String(upcomingTripsCount)} tone="#ecfeff" />
        <Metric label="Saved Hotels" value={String(state.favoriteHotelIds.length)} tone="#fffbeb" />
        <Metric label="My Reviews" value={String(state.reviewsCount)} tone="#f0fdf4" />
      </View>

      {state.panelData?.featuredListings.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{state.panelData.featuredHeading.title}</Text>
          <Text style={styles.sectionSubtitle}>{state.panelData.featuredHeading.subtitle}</Text>
          {state.panelData.featuredListings.map((listing) => (
            <ListingResultCard
              isFavorite={state.favoriteHotelIds.includes(Number(listing.id))}
              key={listing.id}
              listing={listing}
            />
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <ScreenContainer
      scrollable={false}
      title="Dashboard"
      subtitle="Track your stays, search availability, and continue booking."
    >
      <SearchPanel
        ctaLabel={state.panelData?.search.cta ?? 'Search'}
        favoriteHotelIds={state.favoriteHotelIds}
        footerContent={footerContent}
      />
    </ScreenContainer>
  );
}

async function loadDashboard() {
  const [panel, bookings, favorites, reviews] = await Promise.allSettled([
    getHotelPanelData(),
    getClientBookingsPage(1, 10),
    getFavoriteHotelIds(),
    getMyReviewsCount(),
  ]);

  return {
    error: getDashboardError([panel, bookings, favorites, reviews]),
    state: {
      bookingsPage: bookings.status === 'fulfilled' ? bookings.value : null,
      favoriteHotelIds: favorites.status === 'fulfilled' ? favorites.value : [],
      panelData: panel.status === 'fulfilled' ? panel.value : null,
      reviewsCount: reviews.status === 'fulfilled' ? reviews.value : 0,
    },
  };
}

function getDashboardError(results: PromiseSettledResult<unknown>[]): string | null {
  const failed = results.find((result) => result.status === 'rejected');
  if (!failed || failed.status !== 'rejected') return null;
  return failed.reason instanceof Error ? failed.reason.message : 'Some dashboard data could not be loaded.';
}

function getUpcomingTripsCount(bookingsPage: ClientBookingsPage | null): number {
  if (!bookingsPage) return 0;
  const inactiveUpcoming = bookingsPage.inactiveBookings.filter((booking) => booking.status === 'upcoming').length;
  return inactiveUpcoming + (bookingsPage.activeBooking ? 1 : 0);
}

function Metric({ label, value, tone }: { label: string; tone: string; value: string }) {
  return (
    <View style={[styles.metric, { backgroundColor: tone }]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    color: '#b91c1c',
    marginBottom: 14,
    padding: 12,
  },
  metric: {
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 150,
    padding: 16,
  },
  metricLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },
  metricValue: {
    color: '#172554',
    fontSize: 28,
    fontWeight: '900',
  },
  section: {
    gap: 14,
    marginTop: 8,
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#172554',
    fontSize: 22,
    fontWeight: '900',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  footerContent: {
    gap: 18,
  },
});
