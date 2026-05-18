import { Href, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const navItems: { href: Href; label: string }[] = [
  { href: '/(client)/dashboard', label: 'Dashboard' },
  { href: '/(client)/listings', label: 'Listings' },
  { href: '/(client)/favorites', label: 'Favorites' },
  { href: '/(client)/bookings', label: 'Bookings' },
  { href: '/(client)/profile', label: 'Profile' },
  { href: '/(client)/reviews', label: 'Reviews' },
];

export default function ClientNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={styles.nav}>
      <Text style={styles.brand}>StayFinder</Text>
      <View style={styles.items}>
        {navItems.map((item) => {
          const active = pathname.includes(String(item.href).replace('/(client)', ''));
          return (
            <Pressable
              accessibilityRole="button"
              key={item.label}
              onPress={() => router.push(item.href)}
              style={[styles.item, active && styles.activeItem]}>
              <Text style={[styles.itemText, active && styles.activeText]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    gap: 14,
    marginBottom: 22,
  },
  brand: {
    color: '#172554',
    fontSize: 22,
    fontWeight: '900',
  },
  items: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  activeItem: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  itemText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '800',
  },
  activeText: {
    color: '#ffffff',
  },
});
