import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import StatusBadge from '@/components/StatusBadge';
import type { BookingDisplayStatus, MyBooking } from '@/types/booking';

type BookingCardProps = {
  booking: MyBooking;
};

export default function BookingCard({ booking }: BookingCardProps) {
  const router = useRouter();
  const statusLabel = booking.cancelledBadge ?? formatStatus(booking.status);

  function openDetails() {
    router.push({
      pathname: '/(client)/bookings/[id]',
      params: {
        canCancel: String(Boolean(booking.canCancel)),
        canReview: String(Boolean(booking.canReview)),
        cancelledBadge: booking.cancelledBadge ?? '',
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        daysRemaining: booking.daysRemaining ? String(booking.daysRemaining) : '',
        guestsCount: booking.guestsCount ? String(booking.guestsCount) : '',
        hasReview: String(Boolean(booking.hasReview)),
        hotelAddress: booking.hotelAddress ?? '',
        hotelId: booking.hotelId ? String(booking.hotelId) : '',
        hotelImage: booking.hotelImage ?? '',
        hotelName: booking.hotelName,
        id: booking.id,
        lifecycleStatus: booking.lifecycleStatus ?? '',
        paymentMethod: booking.paymentMethod ?? '',
        paymentStatus: booking.paymentStatus ?? '',
        reviewId: booking.reviewId ? String(booking.reviewId) : '',
        roomsCount: booking.roomsCount ? String(booking.roomsCount) : '',
        roomType: booking.roomType,
        status: booking.status,
        totalPrice: String(booking.totalPrice),
      },
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={openDetails}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {booking.hotelImage ? <Image source={{ uri: booking.hotelImage }} style={styles.image} /> : null}
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.hotel}>{booking.hotelName}</Text>
          <StatusBadge label={statusLabel} tone={getStatusTone(booking.status)} />
        </View>
        {booking.hotelAddress ? <Text style={styles.location}>{booking.hotelAddress}</Text> : null}
        <Text style={styles.detail}>{booking.checkIn} to {booking.checkOut}</Text>
        <Text style={styles.detail}>{booking.roomType}</Text>
        <Text style={styles.detail}>
          {booking.guestsCount ?? 1} guest{(booking.guestsCount ?? 1) === 1 ? '' : 's'} - {booking.roomsCount ?? 1}{' '}
          room{(booking.roomsCount ?? 1) === 1 ? '' : 's'}
        </Text>
        <Text style={styles.detail}>Payment {formatPaymentStatus(booking.paymentStatus)}</Text>
        <View style={styles.footer}>
          <Text style={styles.total}>${booking.totalPrice}</Text>
          <Text style={styles.tapHint}>Tap for details</Text>
        </View>
      </View>
    </Pressable>
  );
}

function formatStatus(status: BookingDisplayStatus): string {
  return status.replace('_', ' ');
}

function getStatusTone(status: BookingDisplayStatus) {
  if (status === 'active' || status === 'upcoming') return 'green';
  if (status === 'cancelled') return 'red';
  return 'amber';
}

function formatPaymentStatus(status?: MyBooking['paymentStatus']): string {
  return status ? status.replace(/_/g, ' ') : 'pending';
}

const styles = StyleSheet.create({
  body: {
    gap: 8,
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.82,
  },
  detail: {
    color: '#475569',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 8,
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
    fontSize: 19,
    fontWeight: '900',
  },
  image: {
    height: 150,
    width: '100%',
  },
  location: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '800',
  },
  total: {
    color: '#172554',
    fontSize: 22,
    fontWeight: '900',
  },
  tapHint: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '900',
  },
});
