import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'pharm36.auth.token';
const defaultBaseUrl = 'https://pharm36-backend.onrender.com/api';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || defaultBaseUrl).replace(/\/+$/, '');

let memoryToken;
let tokenLoaded = false;
let unauthorizedHandler;

async function readToken() {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
  }
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function writeToken(token) {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getAuthToken() {
  if (!tokenLoaded) {
    memoryToken = await readToken();
    tokenLoaded = true;
  }
  return memoryToken || null;
}

export async function setAuthToken(token) {
  memoryToken = token || null;
  tokenLoaded = true;
  await writeToken(memoryToken);
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.code = details && !Array.isArray(details) ? details.code : undefined;
  }
}

function queryString(query) {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const value = params.toString();
  return value ? `?${value}` : '';
}

export async function request(path, options = {}) {
  const { method = 'GET', query, body, auth = true, headers = {} } = options;
  const token = auth ? await getAuthToken() : null;
  const requestHeaders = { Accept: 'application/json', ...headers };
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/${path.replace(/^\/+/, '')}${queryString(query)}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiError(`Cannot reach Pharm36 API at ${API_BASE_URL}. Check that the backend is running and the URL is reachable from this device.`, 0, { cause: error?.message });
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && auth) {
      await setAuthToken(null);
      unauthorizedHandler?.();
    }
    throw new ApiError(data?.error || `Request failed (${response.status})`, response.status, data?.details);
  }
  return data;
}

export const api = {
  get: (path, query, options = {}) => request(path, { ...options, method: 'GET', query }),
  post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options = {}) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
};
