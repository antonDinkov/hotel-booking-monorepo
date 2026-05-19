import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import type { ComponentProps, PropsWithChildren } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import AppTextInput from '@/components/AppTextInput';
import EmptyState from '@/components/EmptyState';
import ScreenContainer from '@/components/ScreenContainer';
import { useAuth } from '@/context/AuthContext';
import {
  getCurrentProfile,
  removeProfileAvatar,
  updateCurrentProfile,
  uploadProfileAvatar,
} from '@/lib/clientApi';
import type { ProfileData, ProfileDataWithAvatarUrl } from '@repo/types';

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const EMPTY_ADDRESS: ProfileData['address'] = {
  city: '',
  country: '',
  street: '',
  zip: '',
};
const DEFAULT_PREFERENCES: ProfileData['preferences'] = {
  notifications: true,
  pets: true,
  smoking: false,
};
const DEFAULT_GENDER = 'Prefer not to say';

export default function Profile() {
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<ProfileDataWithAvatarUrl | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setProfile(normalizeProfile(await getCurrentProfile()));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Profile could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  async function handleSave() {
    if (!profile || isSaving) return;
    const validationErrors = validateProfile(profile);
    setErrors(validationErrors);
    setNotice(null);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    setError(null);

    try {
      setProfile(normalizeProfile(await updateCurrentProfile(stripAvatarUrl(profile))));
      setNotice('Profile updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Profile could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePickAvatar() {
    if (!profile || isUploading) return;

    setIsUploading(true);
    setError(null);
    setNotice(null);

    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setError('Photo library permission is required to choose an avatar.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ['images'],
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) return;

      const formData = new FormData();
      appendAvatarFile(formData, result.assets[0]);
      setProfile(normalizeProfile(await uploadProfileAvatar(formData)));
      setNotice('Avatar updated.');
    } catch (avatarError) {
      setError(avatarError instanceof Error ? avatarError.message : 'Avatar upload failed.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!profile?.avatarKey || isUploading) return;

    setIsUploading(true);
    setError(null);
    setNotice(null);

    try {
      setProfile(normalizeProfile(await removeProfileAvatar()));
      setNotice('Avatar removed.');
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Avatar could not be removed.');
    } finally {
      setIsUploading(false);
    }
  }

  function updateProfile(updater: (current: ProfileDataWithAvatarUrl) => ProfileDataWithAvatarUrl) {
    setProfile((current) => (current ? updater(current) : current));
    setNotice(null);
  }

  if (isLoading) {
    return (
      <ScreenContainer title="My Profile" subtitle="Client account and travel details.">
        <ActivityIndicator color="#2563eb" size="large" />
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer title="My Profile">
        <EmptyState
          actionLabel="Retry"
          message={error ?? 'Your profile is not available.'}
          onAction={loadProfile}
          title="Profile unavailable"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="My Profile" subtitle="Client account and travel details.">
      <View style={styles.headerCard}>
        <Avatar profile={profile} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{profile.name || profile.email}</Text>
          <Text style={styles.email}>{profile.email}</Text>
        </View>
      </View>

      <View style={styles.avatarActions}>
        <AppButton
          disabled={isUploading}
          label={isUploading ? 'Working...' : 'Choose Photo'}
          onPress={handlePickAvatar}
          variant="secondary"
        />
        {profile.avatarKey ? (
          <AppButton disabled={isUploading} label="Remove Photo" onPress={handleRemoveAvatar} variant="danger" />
        ) : null}
      </View>

      {notice ? <Text style={styles.successBox}>{notice}</Text> : null}
      {error ? <Text style={styles.errorBox}>{error}</Text> : null}

      <ProfileSection title="Personal Information">
        <ProfileInput
          error={errors.name}
          label="Name"
          onChangeText={(name) => updateProfile((current) => ({ ...current, name }))}
          value={profile.name}
        />
        <ProfileInput editable={false} label="Email" value={profile.email} />
        <ProfileInput
          error={errors.phone}
          label="Phone"
          onChangeText={(phone) => updateProfile((current) => ({ ...current, phone }))}
          value={profile.phone}
        />
      </ProfileSection>

      <ProfileSection title="Address">
        <ProfileInput
          label="Street"
          onChangeText={(street) => updateProfile((current) => ({
            ...current,
            address: { ...current.address, street },
          }))}
          value={profile.address.street}
        />
        <View style={styles.inlineFields}>
          <ProfileInput
            label="City"
            onChangeText={(city) => updateProfile((current) => ({
              ...current,
              address: { ...current.address, city },
            }))}
            value={profile.address.city}
            wrapperStyle={styles.inlineField}
          />
          <ProfileInput
            label="Country"
            onChangeText={(country) => updateProfile((current) => ({
              ...current,
              address: { ...current.address, country },
            }))}
            value={profile.address.country}
            wrapperStyle={styles.inlineField}
          />
        </View>
        <ProfileInput
          label="ZIP"
          onChangeText={(zip) => updateProfile((current) => ({
            ...current,
            address: { ...current.address, zip },
          }))}
          value={profile.address.zip}
        />
      </ProfileSection>

      <ProfileSection title="Travel Details">
        <ProfileInput
          label="Nationality"
          onChangeText={(nationality) => updateProfile((current) => ({ ...current, nationality }))}
          value={profile.nationality}
        />
        <ProfileInput
          error={errors.dateOfBirth}
          label="Date of Birth"
          onChangeText={(dateOfBirth) => updateProfile((current) => ({ ...current, dateOfBirth }))}
          placeholder="YYYY-MM-DD"
          value={profile.dateOfBirth}
        />
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderOptions}>
          {GENDER_OPTIONS.map((gender) => (
            <Pressable
              key={gender}
              onPress={() => updateProfile((current) => ({ ...current, gender }))}
              style={[styles.genderOption, profile.gender === gender && styles.genderOptionActive]}>
              <Text style={[styles.genderText, profile.gender === gender && styles.genderTextActive]}>{gender}</Text>
            </Pressable>
          ))}
        </View>
        <ProfileInput
          label="Passport Number"
          onChangeText={(passportNumber) => updateProfile((current) => ({ ...current, passportNumber }))}
          value={profile.passportNumber}
        />
      </ProfileSection>

      <View style={styles.actions}>
        <AppButton disabled={isSaving} label={isSaving ? 'Saving...' : 'Save Profile'} onPress={handleSave} />
        <AppButton label="Logout" variant="danger" onPress={handleLogout} />
      </View>
    </ScreenContainer>
  );
}

function Avatar({ profile }: { profile: ProfileDataWithAvatarUrl }) {
  if (profile.avatarUrl) {
    return <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />;
  }

  return <Text style={styles.avatar}>{getInitials(profile.name || profile.email || 'Client')}</Text>;
}

function ProfileInput({
  error,
  wrapperStyle,
  ...props
}: ComponentProps<typeof AppTextInput> & { error?: string; wrapperStyle?: object }) {
  return (
    <View style={wrapperStyle}>
      <AppTextInput {...props} />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function ProfileSection({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function appendAvatarFile(formData: FormData, asset: ImagePicker.ImagePickerAsset) {
  if (Platform.OS === 'web' && asset.file) {
    formData.append('avatar', asset.file);
    return;
  }

  const name = asset.fileName ?? `avatar.${getExtension(asset.mimeType)}`;
  const type = asset.mimeType ?? 'image/jpeg';
  formData.append('avatar', { uri: asset.uri, name, type } as unknown as Blob);
}

function getExtension(mimeType?: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/avif') return 'avif';
  return 'jpg';
}

function validateProfile(profile: ProfileDataWithAvatarUrl): Record<string, string> {
  const errors: Record<string, string> = {};
  if (profile.name.trim().length > 120) errors.name = 'Name is too long.';
  if (profile.phone.trim().length > 40) errors.phone = 'Phone is too long.';
  if (profile.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(profile.dateOfBirth)) {
    errors.dateOfBirth = 'Use YYYY-MM-DD.';
  }
  return errors;
}

function stripAvatarUrl(profile: ProfileDataWithAvatarUrl): ProfileData {
  const normalized = normalizeProfile(profile);

  return {
    address: normalized.address,
    avatarKey: normalized.avatarKey,
    dateOfBirth: normalized.dateOfBirth,
    email: normalized.email,
    gender: normalized.gender,
    name: normalized.name,
    nationality: normalized.nationality,
    passportNumber: normalized.passportNumber,
    phone: normalized.phone,
    preferences: normalized.preferences,
  };
}

function normalizeProfile(profile: ProfileDataWithAvatarUrl): ProfileDataWithAvatarUrl {
  const address = profile.address ?? EMPTY_ADDRESS;
  const preferences = profile.preferences ?? DEFAULT_PREFERENCES;

  return {
    address: {
      city: normalizeText(address.city),
      country: normalizeText(address.country),
      street: normalizeText(address.street),
      zip: normalizeText(address.zip),
    },
    avatarKey: typeof profile.avatarKey === 'string' ? profile.avatarKey : null,
    avatarUrl: profile.avatarUrl ?? null,
    dateOfBirth: normalizeText(profile.dateOfBirth),
    email: normalizeText(profile.email),
    gender: normalizeText(profile.gender) || DEFAULT_GENDER,
    name: normalizeText(profile.name),
    nationality: normalizeText(profile.nationality),
    passportNumber: normalizeText(profile.passportNumber),
    phone: normalizeText(profile.phone),
    preferences: {
      notifications: normalizeBoolean(preferences.notifications, DEFAULT_PREFERENCES.notifications),
      pets: normalizeBoolean(preferences.pets, DEFAULT_PREFERENCES.pets),
      smoking: normalizeBoolean(preferences.smoking, DEFAULT_PREFERENCES.smoking),
    },
  };
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
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
  actions: {
    gap: 10,
  },
  avatar: {
    backgroundColor: '#dbeafe',
    borderRadius: 38,
    color: '#1d4ed8',
    fontSize: 24,
    fontWeight: '900',
    height: 76,
    lineHeight: 76,
    overflow: 'hidden',
    textAlign: 'center',
    width: 76,
  },
  avatarActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  avatarImage: {
    borderRadius: 38,
    height: 76,
    width: 76,
  },
  email: {
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
    marginBottom: 14,
    padding: 12,
  },
  fieldError: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  genderOption: {
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  genderOptionActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  genderTextActive: {
    color: '#ffffff',
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
    padding: 16,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  inlineField: {
    flex: 1,
    minWidth: 180,
  },
  inlineFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
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
  successBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#bbf7d0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#047857',
    fontWeight: '800',
    marginBottom: 14,
    padding: 12,
  },
});
