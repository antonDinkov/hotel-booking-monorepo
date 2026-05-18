import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import AppTextInput from '@/components/AppTextInput';
import DateRangeCalendar from '@/components/DateRangeCalendar';
import EmptyState from '@/components/EmptyState';
import ScreenContainer from '@/components/ScreenContainer';
import StatusBadge from '@/components/StatusBadge';
import {
  createPendingBookingHold,
  getHotelAvailability,
  getListingDetails,
} from '@/lib/clientApi';
import type { ListingDetails } from '@/types/hotel-panel';
import type { RoomAvailability } from '@/types/room-availability';

type ListingParams = {
  category?: string;
  checkInDate?: string;
  checkOutDate?: string;
  destination?: string;
  guests?: string;
  id: string;
  imageAlt?: string;
  imageSrc?: string;
  mode?: string;
  name?: string;
  ratingLabel?: string;
  reviewLabel?: string;
};

type DateDraft = {
  checkInDate: string;
  checkOutDate: string;
  guests: string;
};

export default function ListingDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ListingParams>();
  const listingId = String(params.id);
  const category = params.category ? String(params.category) : undefined;
  const imageAlt = params.imageAlt ? String(params.imageAlt) : undefined;
  const imageSrc = params.imageSrc ? String(params.imageSrc) : undefined;
  const name = params.name ? String(params.name) : undefined;
  const ratingLabel = params.ratingLabel ? String(params.ratingLabel) : undefined;
  const reviewLabel = params.reviewLabel ? String(params.reviewLabel) : undefined;
  const destination = params.destination ? String(params.destination) : '';
  const hasSearchDates = Boolean(params.checkInDate && params.checkOutDate);
  const defaultDates = useMemo(getDefaultStayDates, []);
  const routeListing = useMemo(() => getRouteListing({
    category,
    id: listingId,
    imageAlt,
    imageSrc,
    name,
    ratingLabel,
    reviewLabel,
  }), [category, imageAlt, imageSrc, listingId, name, ratingLabel, reviewLabel]);
  const effectiveCheckIn = hasSearchDates ? String(params.checkInDate) : defaultDates.checkInDate;
  const effectiveCheckOut = hasSearchDates ? String(params.checkOutDate) : defaultDates.checkOutDate;
  const guestsCount = Math.max(1, Number.parseInt(String(params.guests ?? ''), 10) || 1);

  const [listing, setListing] = useState<ListingDetails | null>(() => routeListing);
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [roomCounts, setRoomCounts] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [isCheckingDates, setIsCheckingDates] = useState(false);
  const [isPickingDates, setIsPickingDates] = useState(params.mode === 'pickDates');
  const [dateDraft, setDateDraft] = useState<DateDraft>({
    checkInDate: '',
    checkOutDate: '',
    guests: String(guestsCount),
  });

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    Promise.allSettled([
      getListingDetails(listingId),
      getHotelAvailability(listingId, {
        checkInDate: effectiveCheckIn,
        checkOutDate: effectiveCheckOut,
        guests: String(guestsCount),
      }),
    ]).then(([listingResult, availabilityResult]) => {
      if (!active) return;

      if (listingResult.status === 'fulfilled') {
        setListing(listingResult.value);
      } else if (!routeListing) {
        setError(listingResult.reason instanceof Error ? listingResult.reason.message : 'Listing could not be loaded.');
      }

      if (availabilityResult.status === 'fulfilled') {
        setAvailability(availabilityResult.value.rooms);
      } else {
        setAvailability([]);
        setError(availabilityResult.reason instanceof Error ? availabilityResult.reason.message : 'Availability could not be loaded.');
      }

      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [effectiveCheckIn, effectiveCheckOut, guestsCount, listingId, routeListing]);

  const defaultRoomTypeId = useMemo(
    () => getDefaultRoomTypeId(availability, guestsCount),
    [availability, guestsCount],
  );

  useEffect(() => {
    if (!defaultRoomTypeId) {
      setSelectedRoomTypeId(null);
      setRoomCounts({});
      return;
    }

    setSelectedRoomTypeId(defaultRoomTypeId);
    setRoomCounts(buildDefaultRoomCounts(availability, defaultRoomTypeId, guestsCount));
  }, [availability, defaultRoomTypeId, guestsCount]);

  const selectedRoom = availability.find((room) => room.roomTypeId === selectedRoomTypeId) ?? null;
  const selectedRooms = selectedRoomTypeId ? roomCounts[selectedRoomTypeId] ?? 0 : 0;
  const requiredRooms = selectedRoom ? getRequiredRooms(selectedRoom, guestsCount) : 1;
  const hasEnoughSelectedRooms = Boolean(selectedRoom && selectedRooms >= requiredRooms);
  const nights = Math.max(1, getNights(effectiveCheckIn, effectiveCheckOut));
  const totalPrice = selectedRoom ? selectedRoom.pricePerNight * selectedRooms * nights : 0;

  async function handleReserve() {
    if (!listing || !selectedRoom || !hasEnoughSelectedRooms || isReserving || !hasSearchDates) return;

    setIsReserving(true);
    setReserveError(null);

    try {
      const hold = await createPendingBookingHold({
        checkInDate: effectiveCheckIn,
        checkOutDate: effectiveCheckOut,
        guestsCount,
        hotelId: Number(listing.id),
        roomTypeId: selectedRoom.roomTypeId,
        roomsCount: selectedRooms,
      });
      router.push({
        pathname: '/(client)/booking-summary',
        params: { bookingId: String(hold.bookingId), hotelId: listing.id },
      });
    } catch (reserveFailure) {
      setReserveError(reserveFailure instanceof Error ? reserveFailure.message : 'Failed to reserve this room.');
    } finally {
      setIsReserving(false);
    }
  }

  async function handleDateContinue() {
    if (!listing || !selectedRoom || isCheckingDates) return;

    const nextGuests = Math.max(1, Number.parseInt(dateDraft.guests, 10) || 1);
    const validationError = getDateSelectionError(dateDraft);
    if (validationError) {
      setDateError(validationError);
      return;
    }

    setIsCheckingDates(true);
    setDateError(null);

    try {
      const result = await getHotelAvailability(listing.id, {
        checkInDate: dateDraft.checkInDate,
        checkOutDate: dateDraft.checkOutDate,
        guests: String(nextGuests),
      });

      if (!result.hasAvailability) {
        setDateError('No rooms are available for these dates.');
        return;
      }

      router.push({
        pathname: '/(client)/listings/[id]',
        params: {
          category: listing.category,
          checkInDate: dateDraft.checkInDate,
          checkOutDate: dateDraft.checkOutDate,
          destination,
          guests: String(nextGuests),
          id: listing.id,
          imageSrc: listing.image.src,
          name: listing.name,
          ratingLabel: listing.ratingLabel ?? '',
          reviewLabel: listing.reviewLabel,
        },
      });
    } catch (checkError) {
      setDateError(checkError instanceof Error ? checkError.message : 'Unable to check availability.');
    } finally {
      setIsCheckingDates(false);
    }
  }

  if (isLoading && !listing) {
    return (
      <ScreenContainer title="Listing">
        <ActivityIndicator color="#2563eb" size="large" />
      </ScreenContainer>
    );
  }

  if (!listing) {
    return (
      <ScreenContainer title="Listing not found">
        <EmptyState
          actionLabel="Back to dashboard"
          message={error ?? 'This listing is not available.'}
          onAction={() => router.push('/(client)/dashboard')}
          title="No listing found"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title={listing.name} subtitle={listing.location || listing.category}>
      <View style={styles.card}>
        <Image source={{ uri: listing.images[0]?.src ?? listing.image.src }} style={styles.image} />
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <StatusBadge label={listing.ratingLabel ?? formatRating(listing.rating)} tone="green" />
            <StatusBadge label={listing.reviewLabel} />
            {destination ? <StatusBadge label={`Search: ${destination}`} tone="blue" /> : null}
          </View>

          <Text style={styles.description}>{listing.description}</Text>
          <Text style={styles.contextText}>
            {hasSearchDates
              ? `${effectiveCheckIn} to ${effectiveCheckOut} - ${guestsCount} guest${guestsCount === 1 ? '' : 's'}`
              : 'Choose dates before reserving this featured stay.'}
          </Text>

          {isLoading ? <ActivityIndicator color="#2563eb" size="large" /> : null}
          {error ? <Text style={styles.errorBox}>{error}</Text> : null}
          {reserveError ? <Text style={styles.errorBox}>{reserveError}</Text> : null}

          <RoomSelection
            availability={availability}
            guestsCount={guestsCount}
            onRoomCountChange={(roomTypeId, count) => {
              if (roomTypeId !== selectedRoomTypeId) return;
              setRoomCounts((current) => ({ ...current, [roomTypeId]: count }));
            }}
            onSelectRoom={(room) => {
              setSelectedRoomTypeId(room.roomTypeId);
              setRoomCounts(buildDefaultRoomCounts(availability, room.roomTypeId, guestsCount));
            }}
            roomCounts={roomCounts}
            selectedRoomTypeId={selectedRoomTypeId}
          />

          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Price</Text>
            <Text style={styles.summaryTotal}>${totalPrice}</Text>
            <Text style={styles.summaryMeta}>
              {nights} night{nights === 1 ? '' : 's'} x {selectedRooms || 1} room
              {(selectedRooms || 1) === 1 ? '' : 's'}
            </Text>
          </View>

          {!hasSearchDates && isPickingDates ? (
            <DateSelectionPanel
              dateDraft={dateDraft}
              error={dateError}
              isChecking={isCheckingDates}
              maxGuests={Math.max(1, (selectedRoom?.capacity ?? 1) * Math.max(selectedRooms, requiredRooms))}
              onChange={setDateDraft}
              onContinue={handleDateContinue}
            />
          ) : null}

          <AppButton
            disabled={!selectedRoom || !hasEnoughSelectedRooms || isReserving}
            label={
              hasSearchDates
                ? isReserving ? 'Reserving...' : 'Reserve'
                : 'Choose Dates'
            }
            onPress={hasSearchDates ? handleReserve : () => setIsPickingDates(true)}
          />
          <AppButton label="Back" onPress={() => router.back()} variant="ghost" />
        </View>
      </View>
    </ScreenContainer>
  );
}

function RoomSelection({
  availability,
  guestsCount,
  onRoomCountChange,
  onSelectRoom,
  roomCounts,
  selectedRoomTypeId,
}: {
  availability: RoomAvailability[];
  guestsCount: number;
  onRoomCountChange: (roomTypeId: number, count: number) => void;
  onSelectRoom: (room: RoomAvailability) => void;
  roomCounts: Record<number, number>;
  selectedRoomTypeId: number | null;
}) {
  if (!availability.length) {
    return <Text style={styles.emptyText}>No available rooms match the current guest count.</Text>;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Available Rooms</Text>
      {availability.map((room) => {
        const selected = selectedRoomTypeId === room.roomTypeId;
        const options = getRoomOptions(room, guestsCount);

        return (
          <Pressable
            key={room.roomTypeId}
            onPress={() => onSelectRoom(room)}
            style={[styles.roomRow, selected && styles.roomRowSelected]}>
            <View style={styles.roomHeader}>
              <Text style={styles.roomName}>{room.name}</Text>
              <StatusBadge label={selected ? 'Selected' : 'Choose'} tone={selected ? 'green' : 'blue'} />
            </View>
            <Text style={styles.roomMeta}>
              ${room.pricePerNight}/night - {room.availableRooms} left - sleeps {room.capacity} each
            </Text>
            <Text style={styles.roomMeta}>
              {getRequiredRooms(room, guestsCount)} room{getRequiredRooms(room, guestsCount) === 1 ? '' : 's'} needed
            </Text>
            {selected ? (
              <View style={styles.roomCountRow}>
                {options.map((count) => (
                  <Pressable
                    key={count}
                    onPress={() => onRoomCountChange(room.roomTypeId, count)}
                    style={[styles.countButton, roomCounts[room.roomTypeId] === count && styles.countButtonActive]}>
                    <Text style={[
                      styles.countButtonText,
                      roomCounts[room.roomTypeId] === count && styles.countButtonTextActive,
                    ]}>
                      {count}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function DateSelectionPanel({
  dateDraft,
  error,
  isChecking,
  maxGuests,
  onChange,
  onContinue,
}: {
  dateDraft: DateDraft;
  error: string | null;
  isChecking: boolean;
  maxGuests: number;
  onChange: (draft: DateDraft) => void;
  onContinue: () => void;
}) {
  return (
    <View style={styles.datePanel}>
      <Text style={styles.sectionTitle}>Choose Your Dates</Text>
      <DateRangeCalendar
        endDate={dateDraft.checkOutDate}
        minDate={formatToday()}
        onChange={(range) => onChange({
          ...dateDraft,
          checkInDate: range.startDate,
          checkOutDate: range.endDate,
        })}
        startDate={dateDraft.checkInDate}
      />
      <AppTextInput
        keyboardType="number-pad"
        label={`Guests (max ${maxGuests})`}
        onChangeText={(value) => {
          const parsed = Number(value.replace(/[^0-9]/g, ''));
          onChange({ ...dateDraft, guests: parsed ? String(Math.min(parsed, maxGuests)) : '' });
        }}
        value={dateDraft.guests}
      />
      {error ? <Text style={styles.errorBox}>{error}</Text> : null}
      <AppButton
        disabled={isChecking}
        label={isChecking ? 'Checking...' : 'Show availability'}
        onPress={onContinue}
        variant="secondary"
      />
    </View>
  );
}

function getDefaultStayDates() {
  const checkIn = new Date();
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 1);
  return {
    checkInDate: formatDate(checkIn),
    checkOutDate: formatDate(checkOut),
  };
}

function getRouteListing(params: ListingParams): ListingDetails | null {
  if (!params.name || !params.category || !params.imageSrc) return null;

  return {
    amenities: [],
    category: params.category,
    description: 'Availability and booking options for this stay.',
    highlights: [],
    id: params.id,
    image: { alt: params.imageAlt ?? params.name, src: params.imageSrc },
    images: [{ alt: params.imageAlt ?? params.name, src: params.imageSrc }],
    location: params.category,
    name: params.name,
    price: 0,
    pricePerNight: '',
    rating: null,
    ratingLabel: params.ratingLabel || 'New',
    reviewLabel: params.reviewLabel || 'No reviews yet',
  };
}

function getDefaultRoomTypeId(rooms: RoomAvailability[], guestsCount: number): number | null {
  if (!rooms.length) return null;
  const sorted = [...rooms].sort(
    (a, b) => getRequiredRooms(a, guestsCount) - getRequiredRooms(b, guestsCount) || a.capacity - b.capacity,
  );
  const exact = sorted.find((room) => room.capacity * getRequiredRooms(room, guestsCount) === guestsCount);
  return (exact ?? sorted[0]).roomTypeId;
}

function buildDefaultRoomCounts(rooms: RoomAvailability[], roomTypeId: number, guestsCount: number) {
  const next: Record<number, number> = {};
  rooms.forEach((room) => {
    next[room.roomTypeId] = 0;
  });
  const selected = rooms.find((room) => room.roomTypeId === roomTypeId);
  if (selected) {
    next[roomTypeId] = Math.min(selected.availableRooms, Math.max(1, getRequiredRooms(selected, guestsCount)));
  }
  return next;
}

function getRequiredRooms(room: RoomAvailability, guestsCount: number): number {
  return room.requiredRooms ?? Math.ceil(guestsCount / Math.max(1, room.capacity));
}

function getRoomOptions(room: RoomAvailability, guestsCount: number): number[] {
  const requiredRooms = getRequiredRooms(room, guestsCount);
  return Array.from({ length: Math.max(0, room.availableRooms - requiredRooms + 1) }, (_, index) => requiredRooms + index);
}

function getDateSelectionError(draft: DateDraft): string | null {
  if (!draft.checkInDate || !draft.checkOutDate) return 'Please select both check-in and check-out dates.';
  if (parseDateOnly(draft.checkOutDate) <= parseDateOnly(draft.checkInDate)) return 'Check-out must be after check-in.';
  if (!Number.parseInt(draft.guests, 10)) return 'Guests are required.';
  return null;
}

function getNights(checkInDate: string, checkOutDate: string): number {
  return Math.ceil((parseDateOnly(checkOutDate).getTime() - parseDateOnly(checkInDate).getTime()) / 86400000);
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatToday(): string {
  return formatDate(new Date());
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatRating(rating: number | null): string {
  return rating === null ? 'No rating yet' : `${rating.toFixed(1)} rating`;
}

const styles = StyleSheet.create({
  body: {
    gap: 16,
    padding: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  contextText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '800',
  },
  countButton: {
    alignItems: 'center',
    borderColor: '#bfdbfe',
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 48,
  },
  countButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  countButtonText: {
    color: '#1d4ed8',
    fontWeight: '900',
  },
  countButtonTextActive: {
    color: '#ffffff',
  },
  datePanel: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  description: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 24,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
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
  image: {
    height: 260,
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomCountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roomHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  roomMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  roomName: {
    color: '#172554',
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '900',
  },
  roomRow: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  roomRowSelected: {
    borderColor: '#2563eb',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#172554',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryBox: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  summaryLabel: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryMeta: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  summaryTotal: {
    color: '#172554',
    fontSize: 30,
    fontWeight: '900',
  },
});
