import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StoredAuthSession, User } from '@repo/types';

const STORAGE_KEY = 'hotel-booking-mobile-auth';
let memorySession: StoredAuthSession | null = null;

export function loadStoredUser(): User | null {
  return loadStoredSession()?.user ?? null;
}

export function loadStoredSessionCookie(): string | null {
  return loadStoredSession()?.sessionCookie ?? null;
}

export function loadStoredAccessToken(): string | null {
  return loadStoredSession()?.accessToken ?? null;
}

export function loadStoredSession(): StoredAuthSession | null {
  return memorySession;
}

export async function restoreStoredSession(): Promise<StoredAuthSession | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (!value) {
      memorySession = null;
      return null;
    }

    const parsed = parseStoredSession(value);
    memorySession = parsed;
    return parsed;
  } catch {
    memorySession = null;
    return null;
  }
}

export async function saveStoredSession(
  user: User,
  sessionCookie: string | null,
  accessToken: string | null = null,
): Promise<void> {
  const session = { accessToken, user, sessionCookie };
  memorySession = session;

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Keep the in-memory copy so the current session remains usable in this runtime.
  }
}

export async function saveStoredUser(user: User): Promise<void> {
  await saveStoredSession(user, null);
}

export async function clearStoredSession(): Promise<void> {
  memorySession = null;

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, '');
    } catch {
      // Swallow storage errors on logout; the in-memory session is already cleared.
    }
  }
}

export async function clearStoredUser(): Promise<void> {
  await clearStoredSession();
}

function parseStoredSession(value: string): StoredAuthSession | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (isStoredSession(parsed)) {
      return {
        accessToken: parsed.accessToken ?? null,
        sessionCookie: parsed.sessionCookie,
        user: parsed.user,
      };
    }
    if (isStoredUser(parsed)) return { accessToken: null, user: parsed, sessionCookie: null };
    return null;
  } catch {
    return null;
  }
}

function isStoredSession(value: unknown): value is StoredAuthSession {
  if (
    typeof value === 'object' &&
    value !== null &&
    'user' in value &&
    'sessionCookie' in value &&
    isStoredUser((value as { user?: unknown }).user)
  ) {
    const candidate = value as { accessToken?: unknown; sessionCookie?: unknown };
    return (
      (candidate.sessionCookie === null || typeof candidate.sessionCookie === 'string') &&
      (candidate.accessToken === undefined || candidate.accessToken === null || typeof candidate.accessToken === 'string')
    );
  }

  return false;
}

function isStoredUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<User>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.fullName === 'string' &&
    Array.isArray(candidate.roles)
  );
}
