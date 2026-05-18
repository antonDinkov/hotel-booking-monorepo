import { Platform } from 'react-native';

import { loadStoredSessionCookie } from '@/lib/sessionStorage';

const DEFAULT_API_URL = 'http://localhost:3001';

export function getApiUrl(path: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;

  const error = (payload as { error?: { message?: unknown } }).error;
  return typeof error?.message === 'string' ? error.message : fallback;
}

export async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    ...init,
    headers: buildHeaders(init.headers),
    credentials: 'include',
  }).catch((error: unknown) => {
    throw new Error(getNetworkErrorMessage(error));
  });
  const payload = await readJson<T | unknown>(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, 'Request failed.'));
  }

  return payload as T;
}

function buildHeaders(headers?: HeadersInit): HeadersInit {
  const nextHeaders = new Headers(headers);
  const cookie = loadStoredSessionCookie();

  if (Platform.OS !== 'web' && cookie && !nextHeaders.has('Cookie')) {
    nextHeaders.set('Cookie', cookie);
  }

  return nextHeaders;
}

function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return `Unable to reach the backend. ${error.message}`;
  }

  return 'Unable to reach the backend.';
}
