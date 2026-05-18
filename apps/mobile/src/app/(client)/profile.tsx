import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import ScreenContainer from '@/components/ScreenContainer';
import { useAuth } from '@/context/AuthContext';

export default function Profile() {
  const router = useRouter();
  const { authState, logout } = useAuth();
  const user = authState.user;

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <ScreenContainer title="My Profile" subtitle="Client account and travel details.">
      <View style={styles.headerCard}>
        <Text style={styles.avatar}>{getInitials(user?.fullName ?? user?.email ?? 'Client')}</Text>
        <View style={styles.headerText}>
          <Text style={styles.name}>{user?.fullName ?? 'Client'}</Text>
          <Text style={styles.email}>{user?.email ?? 'Not available'}</Text>
        </View>
      </View>

      <ProfileSection title="Personal Information">
        <Detail label="Name" value={user?.fullName ?? 'Client'} />
        <Detail label="Email" value={user?.email ?? 'Not available'} />
        <Detail label="Phone" value="Not provided" />
      </ProfileSection>

      <ProfileSection title="Address">
        <Detail label="Street" value="Not provided" />
        <Detail label="City" value="Not provided" />
        <Detail label="Country" value="Not provided" />
      </ProfileSection>

      <ProfileSection title="Travel Details">
        <Detail label="Nationality" value="Not provided" />
        <Detail label="Date of Birth" value="Not provided" />
        <Detail label="Passport Number" value="Not provided" />
      </ProfileSection>

      <AppButton label="Logout" variant="danger" onPress={handleLogout} />
    </ScreenContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function ProfileSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function getInitials(value: string): string {
  return value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    color: '#1d4ed8',
    fontSize: 24,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 16,
    textAlign: 'center',
    width: 76,
  },
  detail: {
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    gap: 4,
    paddingTop: 12,
  },
  email: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
    padding: 16,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  name: {
    color: '#172554',
    fontSize: 22,
    fontWeight: '900',
  },
  section: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    color: '#172554',
    fontSize: 18,
    fontWeight: '900',
  },
  value: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
  },
});
