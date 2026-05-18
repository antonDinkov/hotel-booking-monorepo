import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import AppTextInput from '@/components/AppTextInput';
import EmptyState from '@/components/EmptyState';
import ScreenContainer from '@/components/ScreenContainer';
import StatusBadge from '@/components/StatusBadge';
import { cancelBooking, getBookingSummary, submitBookingReview } from '@/lib/clientApi';
import type {
  BookingDisplayStatus,
  BookingPaymentMethod,
  BookingPaymentStatus,
  CancelBookingResult,
  MyBooking,
} from '@/types/booking';

const ACTIVE_CANCEL_MESSAGE = 'Current reservations cannot be cancelled. Please contact the host directly.';

type BookingParams = {
  canCancel?: string;
  canReview?: string;
  cancelledBadge?: string;
  checkIn?: string;
  checkOut?: string;
  daysRemaining?: string;
  guestsCount?: string;
  hasReview?: string;
  hotelAddress?: string;
  hotelId?: string;
  hotelImage?: string;
  hotelName?: string;
  id: string;
  lifecycleStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  reviewId?: string;
  roomsCount?: string;
  roomType?: string;
  status?: BookingDisplayStatus;
  totalPrice?: string;
};

export default function BookingDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<BookingParams>();
  const [booking, setBooking] = useState<MyBooking | null>(() => getRouteBooking(params));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!booking);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (booking || !params.id) return;

    setIsLoading(true);
    getBookingSummary(params.id)
      .then((summary) => {
        setBooking({
          checkIn: summary.checkInDate,
          checkOut: summary.checkOutDate,
          guestsCount: summary.guestsCount,
          hotelAddress: summary.hotelLocation,
          hotelId: summary.hotelId,
          hotelName: summary.hotelName,
          id: String(summary.bookingId),
          lifecycleStatus: summary.status,
          paymentMethod: summary.paymentMethod,
          paymentStatus: summary.paymentStatus,
          roomsCount: summary.roomsCount,
          roomType: summary.roomType,
          status: getDisplayStatus(summary.status, summary.checkInDate, summary.checkOutDate),
          totalPrice: summary.totalPrice,
        });
        setError(null);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'This booking is not available.');
      })
      .finally(() => setIsLoading(false));
  }, [booking, params.id]);

  async function handleCancel() {
    if (!booking || isCancelling || booking.status !== 'upcoming') return;

    setIsCancelling(true);
    setError(null);
    setNotice(null);

    try {
      const result = await cancelBooking(booking.id);
      setBooking(toCancelledBooking(booking, result));
      setNotice(result.notification.message);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Cancellation failed.');
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleSubmitReview() {
    if (!booking || isReviewing) return;
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      setError('Rating must be between 1 and 5.');
      return;
    }

    setIsReviewing(true);
    setError(null);
    setNotice(null);

    try {
      const review = await submitBookingReview({
        bookingId: booking.id,
        comment,
        rating: numericRating,
      });
      setBooking({ ...booking, canReview: false, hasReview: true, reviewId: review.id });
      setShowReviewForm(false);
      setNotice('Your review has been published.');
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Review failed.');
    } finally {
      setIsReviewing(false);
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer title="Booking Details">
        <ActivityIndicator color="#2563eb" size="large" />
      </ScreenContainer>
    );
  }

  if (!booking) {
    return (
      <ScreenContainer title="Booking not found">
        <EmptyState
          actionLabel="Back to bookings"
          message={error ?? 'This booking is not available.'}
          onAction={() => router.push('/(client)/bookings')}
          title="No booking found"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Booking Details" subtitle={`Booking #${booking.id}`}>
      <View style={styles.card}>
        {booking.hotelImage ? <Image source={{ uri: booking.hotelImage }} style={styles.image} /> : null}
        <View style={styles.header}>
          <Text style={styles.hotel}>{booking.hotelName}</Text>
          <StatusBadge label={booking.cancelledBadge ?? formatStatus(booking.status)} tone={getStatusTone(booking.status)} />
        </View>

        <Detail label="Location" value={booking.hotelAddress || 'Not available'} />
        <Detail label="Room" value={booking.roomType} />
        <Detail label="Check-in" value={booking.checkIn} />
        <Detail label="Check-out" value={booking.checkOut} />
        <Detail label="Guests" value={String(booking.guestsCount ?? 1)} />
        <Detail label="Rooms" value={String(booking.roomsCount ?? 1)} />
        <Detail label="Payment" value={formatPayment(booking.paymentMethod, booking.paymentStatus)} />
        <Text style={styles.total}>Total ${booking.totalPrice}</Text>

        {booking.status === 'active' ? <ActiveCancellationNotice /> : null}
        {notice ? <Text style={styles.successBox}>{notice}</Text> : null}
        {error ? <Text style={styles.errorBox}>{error}</Text> : null}

        {showReviewForm ? (
          <View style={styles.reviewForm}>
            <AppTextInput
              keyboardType="number-pad"
              label="Rating"
              maxLength={1}
              onChangeText={(value) => setRating(value.replace(/[^1-5]/g, '').slice(0, 1))}
              value={rating}
            />
            <AppTextInput
              label="Comment"
              multiline
              onChangeText={setComment}
              placeholder="Share your stay experience"
              style={styles.commentInput}
              value={comment}
            />
            <AppButton
              disabled={isReviewing}
              label={isReviewing ? 'Submitting...' : 'Submit Review'}
              onPress={handleSubmitReview}
            />
            <AppButton label="Cancel" onPress={() => setShowReviewForm(false)} variant="ghost" />
          </View>
        ) : null}

        <View style={styles.actions}>
          {booking.status === 'past' && booking.canReview && !showReviewForm ? (
            <AppButton label="Leave Review" onPress={() => setShowReviewForm(true)} />
          ) : null}
          {booking.status === 'past' && booking.hasReview ? (
            <AppButton disabled label="Review Submitted" onPress={() => undefined} variant="secondary" />
          ) : null}
          {booking.status === 'upcoming' ? (
            <AppButton
              disabled={isCancelling}
              label={isCancelling ? 'Cancelling...' : 'Cancel Booking'}
              onPress={handleCancel}
              variant="danger"
            />
          ) : null}
          {booking.status === 'active' ? (
            <AppButton disabled label="Cancel Booking" onPress={() => undefined} variant="danger" />
          ) : null}
          <AppButton label="Close" onPress={() => router.back()} variant="ghost" />
        </View>
      </View>
    </ScreenContainer>
  );
}

function ActiveCancellationNotice() {
  if (Platform.OS === 'web') {
    return (
      <Pressable accessibilityHint={ACTIVE_CANCEL_MESSAGE}>
        <Text style={styles.helperText}>{ACTIVE_CANCEL_MESSAGE}</Text>
      </Pressable>
    );
  }

  return <Text style={styles.helperText}>{ACTIVE_CANCEL_MESSAGE}</Text>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function toCancelledBooking(booking: MyBooking, result: CancelBookingResult): MyBooking {
  return {
    ...booking,
    canCancel: false,
    cancelledBadge: getCancelledBadge(result.paymentMethod, result.paymentStatus),
    lifecycleStatus: 'cancelled',
    paymentMethod: result.paymentMethod,
    paymentStatus: result.paymentStatus,
    status: 'cancelled',
  };
}

function getRouteBooking(params: BookingParams): MyBooking | null {
  if (!params.hotelName || !params.checkIn || !params.checkOut || !params.roomType) return null;

  return {
    canCancel: params.canCancel === 'true',
    canReview: params.canReview === 'true',
    cancelledBadge: params.cancelledBadge || undefined,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    daysRemaining: optionalNumber(params.daysRemaining),
    guestsCount: optionalNumber(params.guestsCount),
    hasReview: params.hasReview === 'true',
    hotelAddress: params.hotelAddress,
    hotelId: optionalNumber(params.hotelId),
    hotelImage: params.hotelImage || undefined,
    hotelName: params.hotelName,
    id: params.id,
    lifecycleStatus: params.lifecycleStatus as MyBooking['lifecycleStatus'],
    paymentMethod: normalizePaymentMethod(params.paymentMethod),
    paymentStatus: params.paymentStatus as BookingPaymentStatus | undefined,
    reviewId: optionalNumber(params.reviewId),
    roomsCount: optionalNumber(params.roomsCount),
    roomType: params.roomType,
    status: params.status ?? 'upcoming',
    totalPrice: Number(params.totalPrice ?? 0),
  };
}

function getDisplayStatus(status: string, checkIn: string, checkOut: string): BookingDisplayStatus {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'completed') return 'past';

  const today = parseDateOnly(formatToday());
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (today < start) return 'upcoming';
  if (today >= end) return 'past';
  return 'active';
}

function formatPayment(method?: BookingPaymentMethod | null, status?: BookingPaymentStatus): string {
  const methodLabel = method === 'stripe' ? 'Card' : method === 'cash_on_arrival' ? 'Pay on arrival' : 'Not selected';
  return `${methodLabel} - ${status ? status.replace(/_/g, ' ') : 'pending'}`;
}

function formatStatus(status: BookingDisplayStatus): string {
  return status.replace('_', ' ');
}

function getStatusTone(status: BookingDisplayStatus) {
  if (status === 'active' || status === 'upcoming') return 'green';
  if (status === 'cancelled') return 'red';
  return 'amber';
}

function getCancelledBadge(method: BookingPaymentMethod | null, status: BookingPaymentStatus): string {
  if (method === 'cash_on_arrival' && status === 'cancelled') return 'Cancelled';
  if (method === 'stripe' && status === 'refunded') return 'Cancelled - Refunded';
  if (method === 'stripe' && status === 'refund_denied') return 'Cancelled - Without refund';
  if (method === 'stripe' && status === 'refund_pending') return 'Cancelled - Refund pending';
  return 'Cancelled';
}

function normalizePaymentMethod(value?: string): BookingPaymentMethod | null {
  return value === 'stripe' || value === 'cash_on_arrival' ? value : null;
}

function optionalNumber(value?: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function formatToday(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  commentInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  detailRow: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    gap: 4,
    paddingBottom: 12,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    color: '#b91c1c',
    fontWeight: '800',
    padding: 12,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  helperText: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderRadius: 8,
    borderWidth: 1,
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    padding: 12,
  },
  hotel: {
    color: '#172554',
    flexShrink: 1,
    fontSize: 24,
    fontWeight: '900',
  },
  image: {
    borderRadius: 8,
    height: 210,
    width: '100%',
  },
  label: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  reviewForm: {
    gap: 12,
  },
  successBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#bbf7d0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#047857',
    fontWeight: '800',
    padding: 12,
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
