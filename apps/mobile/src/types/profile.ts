export type ProfilePreferences = {
  smoking: boolean;
  pets: boolean;
  notifications: boolean;
};

export type ProfileAddress = {
  street: string;
  city: string;
  country: string;
  zip: string;
};

export type ProfileData = {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  passportNumber: string;
  avatarKey: string | null;
  preferences: ProfilePreferences;
  address: ProfileAddress;
};

export type ProfileDataWithAvatarUrl = ProfileData & {
  avatarUrl?: string | null;
};
