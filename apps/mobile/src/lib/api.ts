import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { loadStoredSessionCookie } from '@/lib/sessionStorage';

const DEV_BACKEND_PORT = '3000';
const API_BASE_URL_ERROR =
  'EXPO_PUBLIC_API_BASE_URL must be configured for production mobile builds.';

export function getApiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

export function getApiBaseUrl(): string {
  const configuredUrl = getConfiguredApiBaseUrl();
  if (configuredUrl) return normalizeBaseUrl(configuredUrl);

  if (!isProductionEnvironment()) return getDevelopmentApiBaseUrl();

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

function getConfiguredApiBaseUrl(): string | null {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const legacyNativeUrl = process.env.EXPO_PUBLIC_API_URL;
  const legacyWebUrl = process.env.EXPO_PUBLIC_WEB_API_URL;

  if (apiBaseUrl) return apiBaseUrl;
  if (Platform.OS === 'web') return legacyWebUrl ?? legacyNativeUrl ?? null;

  return legacyNativeUrl ?? legacyWebUrl ?? null;
}

function getDevelopmentApiBaseUrl(): string {
  if (Platform.OS === 'web') return getWebDevelopmentApiBaseUrl();

  const expoLanUrl = getExpoLanApiUrl();
  if (expoLanUrl) return expoLanUrl;

  return Platform.OS === 'android'
    ? `http://10.0.2.2:${DEV_BACKEND_PORT}`
    : `http://localhost:${DEV_BACKEND_PORT}`;
}

function getWebDevelopmentApiBaseUrl(): string {
  if (typeof window === 'undefined') return `http://localhost:${DEV_BACKEND_PORT}`;

  return `${window.location.protocol}//${formatHostname(window.location.hostname)}:${DEV_BACKEND_PORT}`;
}

function getExpoLanApiUrl(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.platform?.hostUri;
  const hostname = getHostname(hostUri);

  if (!hostname || isLoopbackHostname(hostname)) return null;

  return `http://${formatHostname(hostname)}:${DEV_BACKEND_PORT}`;
}

function getHostname(value?: string): string | null {
  if (!value) return null;

  try {
    const url = new URL(value.includes('://') ? value : `http://${value}`);
    return url.hostname || null;
  } catch {
    return null;
  }
}

function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}

function isLoopbackHostname(hostname?: string | null): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/$/, '');
}

function formatHostname(hostname: string): string {
  return hostname.includes(':') && !hostname.startsWith('[') ? `[${hostname}]` : hostname;
}
