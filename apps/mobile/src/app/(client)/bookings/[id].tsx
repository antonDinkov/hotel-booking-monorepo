import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import EmptyState from '@/components/EmptyState';
import ScreenContainer from '@/components/ScreenContainer';
import StatusBadge from '@/components/StatusBadge';
import { getBookingById } from '@/data/mockBookings';
import type { BookingDisplayStatus, MyBooking } from '@/types/booking';

type BookingParams = {
  checkIn?: string;
  checkOut?: string;
  hotelAddress?: string;
  hotelId?: string;
  hotelName?: string;
  id: string;
  paymentMethod?: string;
  paymentStatus?: string;
  roomType?: string;
  status?: BookingDisplayStatus;
  totalPrice?: string;
};

export default function BookingDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<BookingParams>();
  const booking = getRouteBooking(params) ?? getBookingById(params.id);

  if (!booking) {
    return (
      <ScreenContainer title="Booking not found">
        <EmptyState
          actionLabel="Back to bookings"
          message="This booking is not available."
          onAction={() => router.push('/(client)/bookings')}
          title="No booking found"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Booking Details" subtitle={booking.id}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.hotel}>{booking.hotelName}</Text>
          <StatusBadge label={booking.status} tone="green" />
        </View>
        <Detail label="Location" value={booking.hotelAddress ?? 'Not available'} />
        <Detail label="Room" value={booking.roomType} />
        <Detail label="Dates" value={`${booking.checkIn} to ${booking.checkOut}`} />
        <Detail label="Payment" value={formatPayment(booking)} />
        <Text style={styles.total}>Total ${booking.totalPrice}</Text>
        {booking.hotelId ? (
          <AppButton
            label="View hotel"
            onPress={() => router.push({ pathname: '/(client)/listings/[id]', params: { id: booking.hotelId } })}
            variant="secondary"
          />
        ) : null}
      </View>
    </ScreenContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function formatPayment(booking: MyBooking): string {
  const method = booking.paymentMethod?.replace('_', ' ') ?? 'Not selected';
  const status = booking.paymentStatus?.replace('_', ' ') ?? 'pending';
  return `${method} - ${status}`;
}

function getRouteBooking(params: BookingParams): MyBooking | null {
  if (!params.hotelName || !params.checkIn || !params.checkOut || !params.roomType) return null;

  return {
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    hotelAddress: params.hotelAddress,
    hotelId: params.hotelId ? Number(params.hotelId) : undefined,
    hotelName: params.hotelName,
    id: params.id,
    paymentMethod: params.paymentMethod === 'stripe' || params.paymentMethod === 'cash_on_arrival'
      ? params.paymentMethod
      : null,
    paymentStatus: params.paymentStatus as MyBooking['paymentStatus'],
    roomType: params.roomType,
    status: params.status ?? 'upcoming',
    totalPrice: Number(params.totalPrice ?? 0),
  };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  detailRow: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    gap: 4,
    paddingBottom: 12,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  hotel: {
    color: '#172554',
    flexShrink: 1,
    fontSize: 24,
    fontWeight: '900',
  },
  label: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  total: {
    color: '#172554',
    fontSize: 26,
    fontWeight: '900',
  },
  value: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
  },
});
