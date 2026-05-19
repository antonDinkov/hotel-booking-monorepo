import { Platform } from 'react-native';

import { loadStoredSessionCookie } from '@/lib/sessionStorage';

const API_BASE_URL_ERROR =
  'EXPO_PUBLIC_API_BASE_URL must be configured for mobile API requests.';

export function getApiUrl(path: string): string {
  return `${getApiBaseUrl()}${normalizeApiPath(path)}`;
}

export function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (apiBaseUrl?.trim()) return normalizeBaseUrl(apiBaseUrl);

  throw new Error(API_BASE_URL_ERROR);
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

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function normalizeApiPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}
