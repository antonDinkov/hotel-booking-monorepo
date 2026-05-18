import { Platform } from 'react-native';

import { getApiErrorMessage, getApiUrl, readJson } from '@/lib/api';
import type { AuthSession, LoginInput, RegisterInput } from '@/types/auth';
import type { User } from '@/types/user';

type NextAuthProvider = { type: string };
type NextAuthProviders = Record<string, NextAuthProvider>;
type NextAuthCsrf = { csrfToken: string };
type NextAuthCallback = { url?: string | null };
type RegisterResponse = { data: { userId: string; email: string; fullName: string; roles: string[] } };
export type LoginResult = { sessionCookie: string | null; user: User };
export type SessionResult = { session: AuthSession; status: number };

const CLIENT_DASHBOARD = '/dashboard';

export async function loginClient(input: LoginInput, fullName?: string): Promise<LoginResult> {
  await assertCredentialsProvider();
  const csrfResponse = await fetch(getApiUrl('/api/auth/csrf'), { credentials: 'include' });
  const csrf = await readJson<NextAuthCsrf>(csrfResponse);

  if (!csrf?.csrfToken) throw new Error('Login is not available right now.');

  const csrfCookie = getResponseCookie(csrfResponse);
  const callbackResponse = await postCredentials(input, csrf.csrfToken, csrfCookie);
  const callback = await readJson<NextAuthCallback>(callbackResponse);
  const error = getLoginError(callback?.url);

  if (error) throw new Error(error);
  if (!callbackResponse.ok) throw new Error('Invalid email or password.');

  const sessionCookie = mergeCookies(csrfCookie, getResponseCookie(callbackResponse));
  const { session } = await fetchAuthSession(sessionCookie);
  return {
    sessionCookie,
    user: mapSessionUser(session, input.email, fullName),
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

async function assertCredentialsProvider(): Promise<void> {
  const response = await fetch(getApiUrl('/api/auth/providers'), { credentials: 'include' });
  const providers = await readJson<NextAuthProviders>(response);

  if (!response.ok || providers?.credentials?.type !== 'credentials') {
    throw new Error('Email login is not configured on the backend.');
  }
}

async function postCredentials(input: LoginInput, csrfToken: string, cookie: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (Platform.OS !== 'web' && cookie) headers.Cookie = cookie;

  return fetch(getApiUrl('/api/auth/callback/credentials'), {
    method: 'POST',
    headers,
    body: new URLSearchParams({
      email: input.email,
      password: input.password,
      loginContext: 'client',
      redirect: 'false',
      callbackUrl: CLIENT_DASHBOARD,
      csrfToken,
      json: 'true',
    }).toString(),
    credentials: 'include',
  });
}

export async function fetchAuthSession(cookie: string | null): Promise<SessionResult> {
  const headers: Record<string, string> = {};
  if (Platform.OS !== 'web' && cookie) headers.Cookie = cookie;

  const response = await fetch(getApiUrl('/api/auth/session'), {
    headers,
    credentials: 'include',
  });

  return {
    session: response.ok ? await readJson<AuthSession>(response) : null,
    status: response.status,
  };
}

function getLoginError(url?: string | null): string | null {
  if (!url) return null;

  try {
    const error = new URL(url).searchParams.get('error');
    if (error === 'CredentialsSignin' || error === 'AccessDenied') return 'Invalid email or password.';
    return error ? decodeURIComponent(error) : null;
  } catch {
    return null;
  }
}

function getResponseCookie(response: Response): string | null {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return null;

  return setCookie
    .split(',')
    .map((cookie) => cookie.trim().split(';')[0])
    .filter(Boolean)
    .join('; ');
}

function mergeCookies(...cookies: (string | null)[]): string | null {
  const values = cookies.filter(Boolean) as string[];
  return values.length > 0 ? values.join('; ') : null;
}

function mapSessionUser(session: AuthSession, email: string, fullName?: string): User {
  return {
    id: session?.user?.id ?? email.trim().toLowerCase(),
    email: session?.user?.email ?? email.trim().toLowerCase(),
    fullName: fullName?.trim() || session?.user?.email?.split('@')[0] || email.split('@')[0],
    roles: session?.user?.roles?.length ? session.user.roles : ['client'],
  };
}
