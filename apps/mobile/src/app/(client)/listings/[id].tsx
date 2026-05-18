import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import EmptyState from '@/components/EmptyState';
import ScreenContainer from '@/components/ScreenContainer';
import StatusBadge from '@/components/StatusBadge';
import { getHotelById } from '@/data/mockHotels';
import { getHotelAvailability } from '@/lib/clientApi';
import type { RoomAvailability } from '@/types/room-availability';

type ListingParams = {
  category?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: string;
  id: string;
  imageSrc?: string;
  name?: string;
  ratingLabel?: string;
  reviewLabel?: string;
};

export default function ListingDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<ListingParams>();
  const { checkInDate, checkOutDate, guests, id } = params;
  const fallbackHotel = getHotelById(params.id);
  const listing = getRouteListing(params, fallbackHotel);
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!checkInDate || !checkOutDate || !guests) return;

    setIsLoading(true);
    getHotelAvailability(id, {
      checkInDate,
      checkOutDate,
      guests,
    })
      .then((result) => {
        setAvailability(result.rooms);
        setError(null);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Availability could not be loaded.');
      })
      .finally(() => setIsLoading(false));
  }, [checkInDate, checkOutDate, guests, id]);

  if (!listing) {
    return (
      <ScreenContainer title="Listing not found">
        <EmptyState
          actionLabel="Back to dashboard"
          message="This listing is not available."
          onAction={() => router.push('/(client)/dashboard')}
          title="No listing found"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title={listing.name} subtitle={listing.category}>
      <View style={styles.card}>
        <Image source={{ uri: listing.imageSrc }} style={styles.image} />
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <StatusBadge label={listing.ratingLabel} tone="green" />
            <StatusBadge label={listing.reviewLabel} />
          </View>
          <Text style={styles.description}>{listing.description}</Text>
          {isLoading ? <ActivityIndicator color="#2563eb" size="large" /> : null}
          {error ? <Text style={styles.errorBox}>{error}</Text> : null}
          <AvailabilityList rooms={availability} />
          <AppButton label="Back to dashboard" onPress={() => router.push('/(client)/dashboard')} />
        </View>
      </View>
    </ScreenContainer>
  );
}

function AvailabilityList({ rooms }: { rooms: RoomAvailability[] }) {
  if (!rooms.length) {
    return <Text style={styles.emptyText}>No room availability loaded.</Text>;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Available Rooms</Text>
      {rooms.map((room) => (
        <View key={room.roomTypeId} style={styles.roomRow}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomMeta}>
            ${room.pricePerNight}/night - {room.availableRooms} available - sleeps {room.capacity}
          </Text>
        </View>
      ))}
    </View>
  );
}

function getRouteListing(params: ListingParams, fallbackHotel: ReturnType<typeof getHotelById>) {
  if (params.name && params.category && params.imageSrc) {
    return {
      category: params.category,
      description: 'Availability and booking options for this stay.',
      imageSrc: params.imageSrc,
      name: params.name,
      ratingLabel: params.ratingLabel || 'No rating yet',
      reviewLabel: params.reviewLabel || 'No reviews yet',
    };
  }

  if (!fallbackHotel) return null;

  return {
    category: fallbackHotel.location,
    description: fallbackHotel.description,
    imageSrc: fallbackHotel.imageUrl,
    name: fallbackHotel.name,
    ratingLabel: `${fallbackHotel.rating.toFixed(1)} rating`,
    reviewLabel: `${fallbackHotel.reviewCount} reviews`,
  };
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
  roomMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  roomName: {
    color: '#172554',
    fontSize: 16,
    fontWeight: '900',
  },
  roomRow: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#172554',
    fontSize: 18,
    fontWeight: '900',
  },
});
