import { Redirect, useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import ScreenContainer from '@/components/ScreenContainer';
import { useAuth } from '@/context/AuthContext';
import { hotels } from '@/data/mockHotels';

export default function Index() {
  const router = useRouter();
  const { authState } = useAuth();
  const featuredHotel = hotels[0];

  if (authState.isAuthenticated) {
    return <Redirect href="/(client)/dashboard" />;
  }

  const primaryHref = '/login';

  return (
    <ScreenContainer showNavigation={false}>
      <View style={styles.hero}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Hotel Booking MVP</Text>
          <Text style={styles.title}>Find bright stays for your next trip.</Text>
          <Text style={styles.subtitle}>
            Browse curated hotels, keep favorites close, and review your booking plans from one client app.
          </Text>
          <View style={styles.actions}>
            <AppButton label="Login" onPress={() => router.push(primaryHref)} />
            <AppButton label="Create account" variant="secondary" onPress={() => router.push('/register')} />
          </View>
        </View>
        <View style={styles.visualCard}>
          <Image source={{ uri: featuredHotel.imageUrl }} style={styles.image} />
          <Text style={styles.hotelName}>{featuredHotel.name}</Text>
          <Text style={styles.hotelMeta}>{featuredHotel.location} · ${featuredHotel.pricePerNight}/night</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 24,
  },
  copy: {
    gap: 14,
  },
  eyebrow: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#172554',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  visualCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  image: {
    height: 230,
    width: '100%',
  },
  hotelName: {
    color: '#172554',
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  hotelMeta: {
    color: '#64748b',
    fontSize: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
});
