import { StyleSheet, View } from 'react-native';

import HotelCard from '@/components/HotelCard';
import ScreenContainer from '@/components/ScreenContainer';
import { hotels } from '@/data/mockHotels';

export default function Listings() {
  return (
    <ScreenContainer
      title="Listings"
      subtitle="Static hotel data for the mobile MVP. Backend search and availability will be connected later.">
      <View style={styles.list}>
        {hotels.map((hotel) => <HotelCard hotel={hotel} key={hotel.id} />)}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
});
