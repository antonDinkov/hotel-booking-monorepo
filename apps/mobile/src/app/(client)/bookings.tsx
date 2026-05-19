import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import BookingCard from '@/components/BookingCard';
import EmptyState from '@/components/EmptyState';
import ScreenContainer from '@/components/ScreenContainer';
import { getClientBookingsPage } from '@/lib/clientApi';
import type { ClientBookingsPage, MyBooking } from '@repo/types';

const PAGE_SIZE = 10;

export default function Bookings() {
  const [bookingsPage, setBookingsPage] = useState<ClientBookingsPage | null>(null);
  const [inactiveBookings, setInactiveBookings] = useState<MyBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pagination = bookingsPage?.pagination;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;
  const hasBookings = Boolean(bookingsPage?.activeBooking || inactiveBookings.length);

  const loadBookings = useCallback(async (page: number, mode: 'replace' | 'append' | 'refresh') => {
    if (mode === 'append') setIsLoadingMore(true);
    if (mode === 'refresh') setIsRefreshing(true);
    if (mode === 'replace') setIsInitialLoading(true);
    setError(null);

    try {
      const nextPage = await getClientBookingsPage(page, PAGE_SIZE);
      setBookingsPage(nextPage);
      setInactiveBookings((current) => (
        mode === 'append' ? mergeBookings(current, nextPage.inactiveBookings) : nextPage.inactiveBookings
      ));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Bookings could not be loaded.');
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings(1, 'replace');
  }, [loadBookings]);

  const header = useMemo(() => (
    <BookingsHeader
      activeBooking={bookingsPage?.activeBooking ?? null}
      error={error}
      hasBookings={hasBookings}
      onRetry={() => void loadBookings(1, 'replace')}
      showInitialLoading={isInitialLoading}
    />
  ), [bookingsPage?.activeBooking, error, hasBookings, isInitialLoading, loadBookings]);

  return (
    <ScreenContainer scrollable={false} title="My Bookings" subtitle="Upcoming, active, past, and cancelled stays.">
      <FlatList
        contentContainerStyle={styles.listContent}
        data={inactiveBookings}
        keyExtractor={(booking) => booking.id}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={isLoadingMore ? <ActivityIndicator color="#2563eb" size="large" /> : null}
        ListHeaderComponent={header}
        onEndReached={() => {
          if (!pagination || !hasMore || isInitialLoading || isLoadingMore) return;
          void loadBookings(pagination.page + 1, 'append');
        }}
        onEndReachedThreshold={0.4}
        onRefresh={() => void loadBookings(1, 'refresh')}
        refreshing={isRefreshing}
        renderItem={({ item }) => <BookingCard booking={item} />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

function BookingsHeader({
  activeBooking,
  error,
  hasBookings,
  onRetry,
  showInitialLoading,
}: {
  activeBooking: MyBooking | null;
  error: string | null;
  hasBookings: boolean;
  onRetry: () => void;
  showInitialLoading: boolean;
}) {
  return (
    <View style={styles.headerContent}>
      {showInitialLoading ? <ActivityIndicator color="#2563eb" size="large" /> : null}
      {error ? <ErrorNotice message={error} onRetry={onRetry} /> : null}
      {!showInitialLoading && !error && !hasBookings ? (
        <EmptyState title="No bookings yet" message="Search for a hotel and start a reservation." />
      ) : null}
      {activeBooking ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Booking</Text>
          <View style={styles.activeWrap}>
            <BookingCard booking={activeBooking} />
          </View>
        </View>
      ) : null}
      {hasBookings ? (
        <Text style={styles.sectionTitle}>{activeBooking ? 'Other Bookings' : 'All Bookings'}</Text>
      ) : null}
    </View>
  );
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
      <AppButton label="Retry" onPress={onRetry} variant="ghost" />
    </View>
  );
}

function mergeBookings(current: MyBooking[], next: MyBooking[]): MyBooking[] {
  const seen = new Set(current.map((booking) => booking.id));
  return [...current, ...next.filter((booking) => !seen.has(booking.id))];
}

const styles = StyleSheet.create({
  activeWrap: {
    borderColor: '#bfdbfe',
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '700',
  },
  headerContent: {
    gap: 16,
    marginBottom: 14,
  },
  listContent: {
    gap: 14,
    paddingBottom: 28,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#172554',
    fontSize: 20,
    fontWeight: '900',
  },
});
