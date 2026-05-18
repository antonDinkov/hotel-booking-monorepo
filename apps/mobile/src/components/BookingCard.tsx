import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import StatusBadge from '@/components/StatusBadge';
import type { BookingDisplayStatus, MyBooking } from '@/types/booking';

type BookingCardProps = {
  booking: MyBooking;
};

export default function BookingCard({ booking }: BookingCardProps) {
  const router = useRouter();
  const statusLabel = booking.cancelledBadge ?? formatStatus(booking.status);

  return (
    <View style={styles.card}>
      {booking.hotelImage ? <Image source={{ uri: booking.hotelImage }} style={styles.image} /> : null}
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.hotel}>{booking.hotelName}</Text>
          <StatusBadge label={statusLabel} tone={getStatusTone(booking.status)} />
        </View>
        {booking.hotelAddress ? <Text style={styles.location}>{booking.hotelAddress}</Text> : null}
        <Text style={styles.detail}>{booking.checkIn} to {booking.checkOut}</Text>
        <Text style={styles.detail}>{booking.roomType}</Text>
        <View style={styles.footer}>
          <Text style={styles.total}>${booking.totalPrice}</Text>
          <AppButton
            label="Details"
            onPress={() => router.push({
              pathname: '/(client)/bookings/[id]',
              params: {
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                hotelAddress: booking.hotelAddress ?? '',
                hotelId: booking.hotelId ? String(booking.hotelId) : '',
                hotelName: booking.hotelName,
                id: booking.id,
                paymentMethod: booking.paymentMethod ?? '',
                paymentStatus: booking.paymentStatus ?? '',
                roomType: booking.roomType,
                status: booking.status,
                totalPrice: String(booking.totalPrice),
              },
            })}
            variant="ghost"
          />
        </View>
      </View>
    </View>
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
});
