import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import StatusBadge from '@/components/StatusBadge';
import type { Listing, SearchHotelsInput } from '@/types/hotel-panel';

type ListingResultCardProps = {
  isFavorite?: boolean;
  listing: Listing;
  searchParams?: Partial<SearchHotelsInput>;
};

export default function ListingResultCard({
  isFavorite = false,
  listing,
  searchParams,
}: ListingResultCardProps) {
  const router = useRouter();

  function openDetails() {
    router.push({
      pathname: '/(client)/listings/[id]',
      params: {
        category: listing.category,
        checkInDate: searchParams?.checkInDate ?? '',
        checkOutDate: searchParams?.checkOutDate ?? '',
        destination: searchParams?.destination ?? '',
        guests: searchParams?.guests ?? '',
        id: listing.id,
        imageAlt: listing.image.alt,
        imageSrc: listing.image.src,
        name: listing.name,
        ratingLabel: listing.ratingLabel ?? '',
        reviewLabel: listing.reviewLabel,
      },
    });
  }

  return (
    <View style={styles.card}>
      <Image source={{ uri: listing.image.src }} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{listing.name}</Text>
          <View style={styles.badges}>
            {listing.isFeatured ? <StatusBadge label="Featured" tone="green" /> : null}
            {isFavorite ? <StatusBadge label="Saved" tone="amber" /> : null}
          </View>
        </View>
        <Text style={styles.location}>{listing.category}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{listing.ratingLabel ?? formatRating(listing.rating)}</Text>
          <Text style={styles.meta}>{listing.reviewLabel}</Text>
          {typeof listing.minPrice === 'number' ? (
            <Text style={styles.meta}>From ${listing.minPrice} / night</Text>
          ) : null}
        </View>
        <AppButton label="Check availability" onPress={openDetails} variant="secondary" />
      </View>
    </View>
  );
}

function formatRating(rating: number | null): string {
  return rating === null ? 'No rating yet' : `${rating.toFixed(1)} rating`;
}

const styles = StyleSheet.create({
  body: {
    gap: 10,
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    height: 170,
    width: '100%',
  },
  location: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '800',
  },
  meta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    color: '#172554',
    flexShrink: 1,
    fontSize: 20,
    fontWeight: '900',
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
});
