import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import StatusBadge from '@/components/StatusBadge';
import type { Hotel } from '@/types/hotel';

type HotelCardProps = {
  hotel: Hotel;
};

export default function HotelCard({ hotel }: HotelCardProps) {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Image source={{ uri: hotel.imageUrl }} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{hotel.name}</Text>
          {hotel.isFeatured ? <StatusBadge label="Featured" tone="amber" /> : null}
        </View>
        <Text style={styles.location}>{hotel.location}</Text>
        <Text style={styles.description}>{hotel.description}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{hotel.rating.toFixed(1)} rating</Text>
          <Text style={styles.meta}>{hotel.reviewCount} reviews</Text>
          <Text style={styles.price}>${hotel.pricePerNight}/night</Text>
        </View>
        <AppButton
          label="View details"
          onPress={() => router.push({ pathname: '/(client)/listings/[id]', params: { id: hotel.id } })}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    height: 180,
    width: '100%',
  },
  body: {
    gap: 10,
    padding: 16,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  name: {
    color: '#172554',
    flexShrink: 1,
    fontSize: 20,
    fontWeight: '900',
  },
  location: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '800',
  },
  description: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  meta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  price: {
    color: '#172554',
    fontSize: 13,
    fontWeight: '900',
  },
});
