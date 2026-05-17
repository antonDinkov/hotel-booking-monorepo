import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { partners, userProfiles, users } from "@/db/schema";
import { resolveImageUrl } from "@/lib/image-urls";
import type {
  PartnerAccountSettings,
  PartnerAccountSettingsUpdateInput,
  PartnerCompanySettings,
  PartnerCompanySettingsUpdateInput,
  PartnerSettingsData,
  PartnerVerificationStatus,
} from "@/types/partner-settings";

type AccountRow = {
  email: string;
  passwordHash: string | null;
  fullName: string | null;
  phone: string | null;
  avatarKey: string | null;
};

type PartnerRow = {
  id: string;
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
  verificationStatus: string;
};

function toNullableString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getAvatarUrl(avatarKey: string | null): string | null {
  return avatarKey ? resolveImageUrl(avatarKey) : null;
}

function mapAccount(row: AccountRow): PartnerAccountSettings {
  return {
    email: row.email,
    fullName: row.fullName,
    phone: row.phone,
    avatarUrl: getAvatarUrl(row.avatarKey),
    canChangePassword: Boolean(row.passwordHash),
  };
}

function mapPartner(row: PartnerRow): PartnerCompanySettings {
  return {
    companyName: row.companyName,
    representativeFirstName: row.representativeFirstName,
    representativeLastName: row.representativeLastName,
    position: row.position,
    email: row.email,
    phone: row.phone,
    website: row.website,
    companyAddress: row.companyAddress,
    vatNumber: row.vatNumber,
    isVerified: row.isVerified,
    verificationStatus: row.verificationStatus as PartnerVerificationStatus,
  };
}

async function getAccountRow(userId: string): Promise<AccountRow | null> {
  return db
    .select({
      email: users.email,
      passwordHash: users.passwordHash,
      fullName: userProfiles.fullName,
      phone: userProfiles.phone,
      avatarKey: userProfiles.avatarKey,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.id, userId))
    .then((rows) => rows[0] ?? null);
}

async function getPartnerRow(userId: string): Promise<PartnerRow | null> {
  return db
    .select({
      id: partners.id,
      companyName: partners.companyName,
      representativeFirstName: partners.representativeFirstName,
      representativeLastName: partners.representativeLastName,
      position: partners.position,
      email: partners.email,
      phone: partners.phone,
      website: partners.website,
      companyAddress: partners.companyAddress,
      vatNumber: partners.vatNumber,
      isVerified: partners.isVerified,
      verificationStatus: partners.verificationStatus,
    })
    .from(partners)
    .where(eq(partners.userId, userId))
    .then((rows) => rows[0] ?? null);
}

async function requireAccountRow(userId: string): Promise<AccountRow> {
  const row = await getAccountRow(userId);
  if (!row) throw new Error("USER_NOT_FOUND");
  return row;
}

async function requirePartnerRow(userId: string): Promise<PartnerRow> {
  const row = await getPartnerRow(userId);
  if (!row) throw new Error("PARTNER_PROFILE_NOT_FOUND");
  return row;
}

async function assertCompanyValuesAreUnique(
  partnerId: string,
  input: PartnerCompanySettingsUpdateInput
): Promise<void> {
  const emailMatch = await db
    .select({ id: partners.id })
    .from(partners)
    .where(and(eq(partners.email, input.email), ne(partners.id, partnerId)))
    .then((rows) => rows[0]);

  if (emailMatch) throw new Error("PARTNER_EMAIL_ALREADY_EXISTS");

  if (!input.vatNumber) return;

  const vatMatch = await db
    .select({ id: partners.id })
    .from(partners)
    .where(and(eq(partners.vatNumber, input.vatNumber), ne(partners.id, partnerId)))
    .then((rows) => rows[0]);

  if (vatMatch) throw new Error("VAT_NUMBER_ALREADY_EXISTS");
}

async function updatePasswordIfRequested(
  userId: string,
  account: AccountRow,
  input: PartnerAccountSettingsUpdateInput
): Promise<void> {
  if (!input.currentPassword || !input.newPassword) return;
  if (!account.passwordHash) throw new Error("PASSWORD_CHANGE_UNAVAILABLE");

  const isCurrentPasswordValid = await bcrypt.compare(
    input.currentPassword,
    account.passwordHash
  );
  if (!isCurrentPasswordValid) throw new Error("INVALID_CURRENT_PASSWORD");

  const passwordHash = await bcrypt.hash(
    input.newPassword,
    Number(process.env.BCRYPT_SALT_ROUNDS ?? 10)
  );
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

async function upsertProfile(
  userId: string,
  input: PartnerAccountSettingsUpdateInput
): Promise<void> {
  if (input.fullName === undefined && input.phone === undefined) return;

  await db
    .insert(userProfiles)
    .values({
      userId,
      fullName: toNullableString(input.fullName),
      phone: toNullableString(input.phone),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        ...(input.fullName !== undefined
          ? { fullName: toNullableString(input.fullName) }
          : {}),
        ...(input.phone !== undefined
          ? { phone: toNullableString(input.phone) }
          : {}),
        updatedAt: new Date(),
      },
    });
}

export async function getPartnerAccountSettings(
  userId: string
): Promise<PartnerAccountSettings> {
  const account = await requireAccountRow(userId);
  await requirePartnerRow(userId);
  return mapAccount(account);
}

export async function getPartnerCompanySettings(
  userId: string
): Promise<PartnerCompanySettings> {
  return mapPartner(await requirePartnerRow(userId));
}

export async function getPartnerSettings(
  userId: string
): Promise<PartnerSettingsData> {
  const [account, partner] = await Promise.all([
    getPartnerAccountSettings(userId),
    getPartnerCompanySettings(userId),
  ]);

  return { account, partner };
}

export async function updatePartnerAccountSettings(
  userId: string,
  input: PartnerAccountSettingsUpdateInput
): Promise<PartnerAccountSettings> {
  const account = await requireAccountRow(userId);
  await requirePartnerRow(userId);

  await updatePasswordIfRequested(userId, account, input);
  await upsertProfile(userId, input);

  return getPartnerAccountSettings(userId);
}

export async function updatePartnerCompanySettings(
  userId: string,
  input: PartnerCompanySettingsUpdateInput
): Promise<PartnerCompanySettings> {
  const partner = await requirePartnerRow(userId);
  await assertCompanyValuesAreUnique(partner.id, input);

  await db
    .update(partners)
    .set({
      companyName: input.companyName,
      representativeFirstName: input.representativeFirstName,
      representativeLastName: input.representativeLastName,
      position: input.position,
      email: input.email,
      phone: toNullableString(input.phone),
      website: toNullableString(input.website),
      companyAddress: toNullableString(input.companyAddress),
      vatNumber: toNullableString(input.vatNumber),
      updatedAt: new Date(),
    })
    .where(and(eq(partners.id, partner.id), eq(partners.userId, userId)));

  return getPartnerCompanySettings(userId);
}
