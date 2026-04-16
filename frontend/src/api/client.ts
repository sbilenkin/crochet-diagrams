const API_BASE = 'http://localhost:8000';

const TOKEN_KEY = 'accessToken';

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestInitWithJson extends Omit<RequestInit, 'body'> {
  json?: unknown;
}

async function request<T>(path: string, init: RequestInitWithJson = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body,
  });

  if (response.status === 401) {
    clearAccessToken();
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userId');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Unauthorized');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const detail =
      (data && typeof data === 'object' && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : undefined) ?? `Request failed (${response.status})`;
    throw new ApiError(response.status, detail);
  }

  return data as T;
}

export const apiGet = <T>(path: string) => request<T>(path, { method: 'GET' });
export const apiPost = <T>(path: string, json?: unknown) =>
  request<T>(path, { method: 'POST', json });
export const apiPut = <T>(path: string, json?: unknown) =>
  request<T>(path, { method: 'PUT', json });
export const apiDelete = <T>(path: string) =>
  request<T>(path, { method: 'DELETE' });
