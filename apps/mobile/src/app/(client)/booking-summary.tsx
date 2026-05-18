import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import EmptyState from '@/components/EmptyState';
import ScreenContainer from '@/components/ScreenContainer';
import {
  cancelBooking,
  confirmCashOnArrival,
  getBookingSummary,
  startStripeCheckout,
} from '@/lib/clientApi';
import type { BookingSummary } from '@/types/booking';

type SummaryParams = {
  bookingId?: string;
  hotelId?: string;
};

export default function BookingSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<SummaryParams>();
  const bookingId = String(params.bookingId ?? '');
  const hasCancelledExpiredHoldRef = useRef(false);
  const [summary, setSummary] = useState<BookingSummary | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancellingFlow, setIsCancellingFlow] = useState(false);
  const [isCashLoading, setIsCashLoading] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    if (!bookingId) return;
    setIsLoading(true);
    setError(null);

    try {
      const nextSummary = await getBookingSummary(bookingId);
      setSummary(nextSummary);
      setSecondsRemaining(getSecondsRemaining(nextSummary.expiresAt));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Booking summary could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(getSecondsRemaining(summary?.expiresAt ?? null));
    }, 1000);
    return () => clearInterval(timer);
  }, [summary?.expiresAt]);

  const holdExpired = Boolean(
    summary?.status === 'expired' ||
    summary?.status === 'cancelled' ||
    (summary?.status === 'pending_payment' && secondsRemaining <= 0),
  );
  const canPay = Boolean(summary?.status === 'pending_payment' && !holdExpired);
  const supportsStripe = Boolean(summary?.supportedPaymentMethods.includes('stripe'));
  const supportsCashOnArrival = Boolean(summary?.supportedPaymentMethods.includes('cash_on_arrival'));
  const isActionLoading = isCashLoading || isStripeLoading || isCancellingFlow;

  useEffect(() => {
    if (!summary || summary.status !== 'pending_payment' || secondsRemaining > 0 || hasCancelledExpiredHoldRef.current) {
      return;
    }

    hasCancelledExpiredHoldRef.current = true;
    void cancelBooking(String(summary.bookingId))
      .then(() => loadSummary())
      .catch(() => {
        hasCancelledExpiredHoldRef.current = false;
      });
  }, [loadSummary, secondsRemaining, summary]);

  async function cancelPendingHoldBeforeNavigation(target: 'dashboard' | 'dates' | 'hotel') {
    if (!summary) return;

    if (summary.status !== 'pending_payment' || holdExpired) {
      navigateAway(target, summary);
      return;
    }

    if (isActionLoading) return;
    setIsCancellingFlow(true);
    setError(null);

    try {
      await cancelBooking(String(summary.bookingId));
      navigateAway(target, summary);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Failed to cancel reservation hold.');
    } finally {
      setIsCancellingFlow(false);
    }
  }

  async function handleCashOnArrival() {
    if (!summary || !canPay || !supportsCashOnArrival || isActionLoading) return;

    setIsCashLoading(true);
    setError(null);
    setNotice(null);

    try {
      await confirmCashOnArrival(String(summary.bookingId));
      setShowPaymentModal(false);
      setNotice('Your reservation is secured. Payment will be collected at the hotel.');
      await loadSummary();
    } catch (cashError) {
      setError(cashError instanceof Error ? cashError.message : 'Failed to confirm booking.');
    } finally {
      setIsCashLoading(false);
    }
  }

  async function handleStripeCheckout() {
    if (!summary || !canPay || !supportsStripe || isActionLoading) return;

    setIsStripeLoading(true);
    setError(null);
    setNotice(null);

    try {
      const checkout = await startStripeCheckout(String(summary.bookingId));
      await WebBrowser.openBrowserAsync(checkout.url);
      setShowPaymentModal(false);
      setNotice('Checkout opened. Payment status is updated by Stripe after completion.');
      await loadSummary();
    } catch (stripeError) {
      setError(stripeError instanceof Error ? stripeError.message : 'Failed to start card payment.');
    } finally {
      setIsStripeLoading(false);
    }
  }

  if (isLoading && !summary) {
    return (
      <ScreenContainer title="Booking Summary">
        <ActivityIndicator color="#2563eb" size="large" />
      </ScreenContainer>
    );
  }

  if (!summary) {
    return (
      <ScreenContainer title="Booking Summary">
        <EmptyState
          actionLabel="Retry"
          message={error ?? 'This reservation hold is not available.'}
          onAction={loadSummary}
          title="Summary unavailable"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Booking Summary" subtitle={`Booking #${summary.bookingId}`}>
      <View style={styles.card}>
        {notice ? <Text style={styles.successBox}>{notice}</Text> : null}
        {error ? <Text style={styles.errorBox}>{error}</Text> : null}
        {holdExpired ? <Text style={styles.errorBox}>This reservation hold has expired. Payment actions are disabled.</Text> : null}

        <Detail label="Hotel" value={`${summary.hotelName}\n${summary.hotelLocation}`} />
        <Detail label="Room type" value={summary.roomType} />
        <Detail label="Check-in" value={summary.checkInDate} />
        <Detail label="Check-out" value={summary.checkOutDate} />
        <Detail label="Guests" value={String(summary.guestsCount)} />
        <Detail label="Rooms" value={String(summary.roomsCount)} />

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Total Price</Text>
          <Text style={styles.price}>${summary.totalPrice}</Text>
          <Text style={styles.priceMeta}>
            ${summary.pricePerNight} x {summary.nights} night{summary.nights === 1 ? '' : 's'} x {summary.roomsCount}{' '}
            room{summary.roomsCount === 1 ? '' : 's'}
          </Text>
        </View>

        {summary.status === 'pending_payment' ? (
          <View style={styles.timerBox}>
            <Text style={styles.timerLabel}>Your reservation is held for</Text>
            <Text style={styles.timer}>{formatCountdown(secondsRemaining)}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <AppButton
            disabled={!canPay || (!supportsStripe && !supportsCashOnArrival)}
            label="Go to payment"
            onPress={() => setShowPaymentModal(true)}
          />
          <AppButton
            disabled={isCancellingFlow}
            label={isCancellingFlow ? 'Cancelling hold...' : 'Change dates'}
            onPress={() => void cancelPendingHoldBeforeNavigation('dates')}
            variant="secondary"
          />
          <AppButton
            disabled={isCancellingFlow}
            label="Continue exploring"
            onPress={() => void cancelPendingHoldBeforeNavigation('dashboard')}
            variant="ghost"
          />
        </View>
      </View>

      <Modal transparent visible={showPaymentModal} animationType="fade" onRequestClose={() => setShowPaymentModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose payment method</Text>
            {error ? <Text style={styles.errorBox}>{error}</Text> : null}
            <AppButton
              disabled={!supportsStripe || !canPay || isActionLoading}
              label={isStripeLoading ? 'Opening checkout...' : 'Pay now with card'}
              onPress={handleStripeCheckout}
            />
            <AppButton
              disabled={!supportsCashOnArrival || !canPay || isActionLoading}
              label={isCashLoading ? 'Confirming...' : 'Pay on arrival'}
              onPress={handleCashOnArrival}
              variant="secondary"
            />
            <AppButton
              disabled={isActionLoading}
              label="Close"
              onPress={() => setShowPaymentModal(false)}
              variant="ghost"
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );

  function navigateAway(target: 'dashboard' | 'dates' | 'hotel', current: BookingSummary) {
    if (target === 'dashboard') {
      router.push('/(client)/dashboard');
      return;
    }

    router.push({
      pathname: '/(client)/listings/[id]',
      params: {
        guests: String(current.guestsCount),
        id: String(current.hotelId),
        mode: target === 'dates' ? 'pickDates' : '',
      },
    });
  }
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function getSecondsRemaining(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
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
  label: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    gap: 12,
    maxWidth: 420,
    padding: 18,
    width: '100%',
  },
  modalTitle: {
    color: '#172554',
    fontSize: 20,
    fontWeight: '900',
  },
  price: {
    color: '#172554',
    fontSize: 34,
    fontWeight: '900',
  },
  priceBox: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  priceLabel: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  priceMeta: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
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
  timer: {
    color: '#172554',
    fontSize: 32,
    fontWeight: '900',
  },
  timerBox: {
    backgroundColor: '#ecfeff',
    borderColor: '#67e8f9',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  timerLabel: {
    color: '#155e75',
    fontSize: 13,
    fontWeight: '800',
  },
  value: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
});
