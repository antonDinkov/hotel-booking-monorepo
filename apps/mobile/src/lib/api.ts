import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { loadStoredSessionCookie } from '@/lib/sessionStorage';

const BACKEND_PORT = '3001';
const LOCAL_API_URL = `http://localhost:${BACKEND_PORT}`;
const DEFAULT_API_URL = Platform.select({
  android: 'http://172.26.78.77:3001',
  default: LOCAL_API_URL,
});

export function getApiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

export function getApiBaseUrl(): string {
  const envMobile = process.env.EXPO_PUBLIC_API_URL;
  const envWeb = process.env.EXPO_PUBLIC_WEB_API_URL;
  const baseForWeb = envWeb ?? envMobile ?? DEFAULT_API_URL ?? LOCAL_API_URL;

  if (Platform.OS === 'web') {
    return normalizeBaseUrl(baseForWeb);
  }

  return getNativeApiBaseUrl(envMobile);
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

function getNativeApiBaseUrl(configuredUrl?: string): string {
  if (configuredUrl && !isLoopbackUrl(configuredUrl)) {
    return normalizeBaseUrl(configuredUrl);
  }

  const expoLanUrl = getExpoLanApiUrl();
  if (expoLanUrl) return expoLanUrl;

  return normalizeBaseUrl(DEFAULT_API_URL ?? LOCAL_API_URL);
}

function getExpoLanApiUrl(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.platform?.hostUri;
  const hostname = getHostname(hostUri);

  if (!hostname || isLoopbackHostname(hostname)) return null;

  return `http://${formatHostname(hostname)}:${BACKEND_PORT}`;
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

function isLoopbackUrl(value: string): boolean {
  return isLoopbackHostname(getHostname(value));
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
