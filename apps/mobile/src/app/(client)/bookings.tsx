import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import BookingCard from '@/components/BookingCard';
import EmptyState from '@/components/EmptyState';
import ScreenContainer from '@/components/ScreenContainer';
import { getClientBookingsPage } from '@/lib/clientApi';
import type { ClientBookingsPage } from '@/types/booking';

export default function Bookings() {
  const [bookingsPage, setBookingsPage] = useState<ClientBookingsPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setBookingsPage(await getClientBookingsPage(1, 10));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Bookings could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  return (
    <ScreenContainer title="My Bookings" subtitle="Upcoming, active, past, and cancelled stays.">
      {isLoading ? <ActivityIndicator color="#2563eb" size="large" /> : null}
      {error ? <ErrorNotice message={error} onRetry={loadBookings} /> : null}
      {!isLoading && bookingsPage ? <BookingsList bookingsPage={bookingsPage} /> : null}
    </ScreenContainer>
  );
}

function BookingsList({ bookingsPage }: { bookingsPage: ClientBookingsPage }) {
  const hasBookings = Boolean(bookingsPage.activeBooking || bookingsPage.inactiveBookings.length);

  if (!hasBookings) {
    return <EmptyState title="No bookings yet" message="Search for a hotel and start a reservation." />;
  }

  return (
    <View style={styles.list}>
      {bookingsPage.activeBooking ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Booking</Text>
          <BookingCard booking={bookingsPage.activeBooking} />
        </View>
      ) : null}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{bookingsPage.activeBooking ? 'Other Bookings' : 'All Bookings'}</Text>
        {bookingsPage.inactiveBookings.map((booking) => <BookingCard booking={booking} key={booking.id} />)}
      </View>
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

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
    padding: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    gap: 22,
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
