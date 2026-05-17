export type PartnerVerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "suspended";

export type PartnerAccountSettings = {
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  canChangePassword: boolean;
};

export type PartnerCompanySettings = {
  companyName: string;
  representativeFirstName: string;
  representativeLastName: string;
  position: string;
  email: string;
  phone: string | null;
  website: string | null;
  companyAddress: string | null;
  vatNumber: string | null;
  isVerified: boolean;
  verificationStatus: PartnerVerificationStatus;
};

export type PartnerSettingsData = {
  account: PartnerAccountSettings;
  partner: PartnerCompanySettings;
};

export type PartnerAccountSettingsUpdateInput = {
  fullName?: string | null;
  phone?: string | null;
  currentPassword?: string;
  newPassword?: string;
};

export type PartnerCompanySettingsUpdateInput = {
  companyName: string;
  representativeFirstName: string;
  representativeLastName: string;
  position: string;
  email: string;
  phone: string | null;
  website: string | null;
  companyAddress: string | null;
  vatNumber: string | null;
};

export type PartnerSettingsClientProps = {
  initialSettings: PartnerSettingsData;
};

export type PartnerSettingsApiPayload<T> = {
  data?: T;
  error?: {
    message?: string;
    code?: string;
  };
};
