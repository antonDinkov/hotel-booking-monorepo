export type AdminAccountSettings = {
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  roles: string[];
  isActive: boolean;
  createdAt: string | null;
  canChangePassword: boolean;
};

export type AdminAccountSettingsUpdateInput = {
  fullName?: string | null;
  phone?: string | null;
};

export type AdminSettingsClientProps = {
  initialSettings: AdminAccountSettings;
};

export type AdminSettingsApiPayload<T> = {
  data?: T;
  error?: {
    message?: string;
    code?: string;
  };
};
