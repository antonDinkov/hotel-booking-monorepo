import { Platform } from 'react-native';

import { getApiErrorMessage, getApiUrl, readJson } from '@/lib/api';
import type { ApiResponse, AuthSession, LoginInput, MobileLoginResult, RegisterInput } from '@repo/types';

type RegisterResponse = { data: { userId: string; email: string; fullName: string; roles: string[] } };
export type LoginResult = MobileLoginResult & { sessionCookie: string | null };
export type SessionResult = { session: AuthSession; status: number };

export async function loginClient(input: LoginInput, fullName?: string): Promise<LoginResult> {
  const response = await fetch(getApiUrl('/api/auth/mobile-login'), {
    body: JSON.stringify(input),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  const payload = await readJson<ApiResponse<MobileLoginResult> | unknown>(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, 'Invalid email or password.'));
  }

  const result = getResponseData<MobileLoginResult>(payload);
  if (!result?.accessToken) throw new Error('Login did not return an access token.');

  return {
    accessToken: result.accessToken,
    sessionCookie: null,
    user: fullName?.trim()
      ? { ...result.user, fullName: fullName.trim() }
      : result.user,
  };
}

export async function registerClient(input: RegisterInput): Promise<void> {
  const response = await fetch(getApiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  });
  const payload = await readJson<RegisterResponse | unknown>(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, 'Registration failed.'));
  }
}

export async function fetchAuthSession(
  cookie: string | null,
  accessToken: string | null,
): Promise<SessionResult> {
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (Platform.OS !== 'web' && cookie) headers.Cookie = cookie;

  const response = await fetch(getApiUrl('/api/auth/mobile-session'), {
    headers,
    credentials: 'include',
  });
  const payload = response.ok ? await readJson<ApiResponse<AuthSession> | AuthSession>(response) : null;

  return {
    session: response.ok ? getSessionData(payload) : null,
    status: response.status,
  };
}

function getResponseData<T>(payload: ApiResponse<T> | unknown): T | null {
  return hasData<T>(payload) ? payload.data : null;
}

function getSessionData(payload: ApiResponse<AuthSession> | AuthSession | null): AuthSession {
  if (!payload) return null;
  return hasData<AuthSession>(payload) ? payload.data : payload;
}

function hasData<T>(payload: ApiResponse<T> | unknown): payload is ApiResponse<T> {
  return typeof payload === 'object' && payload !== null && 'data' in payload;
}
