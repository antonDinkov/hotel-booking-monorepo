import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import EmptyState from '@/components/EmptyState';
import HotelCard from '@/components/HotelCard';
import ScreenContainer from '@/components/ScreenContainer';
import { getFavoriteHotels } from '@/data/mockHotels';

export default function Favorites() {
  const router = useRouter();
  const favorites = getFavoriteHotels();

  return (
    <ScreenContainer title="Favorites" subtitle="Mock favorites matching the client booking workflow.">
      {favorites.length === 0 ? (
        <EmptyState title="No favorites yet" message="Save hotels you want to compare later." actionLabel="Browse listings" onAction={() => router.push('/(client)/listings')} />
      ) : (
        <View style={styles.list}>
          {favorites.map((hotel) => <HotelCard hotel={hotel} key={hotel.id} />)}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
});
