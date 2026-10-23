// fetch for /api/* with the access token; on 401 refreshes once and retries (plan section 7.4).
import { forgetAccessToken, getAccessToken, OfflineError, refreshSession } from './auth';

export class UnauthorizedError extends Error {
  constructor() {
    super('Session expired');
  }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`API error ${status}`);
  }
}

async function send(path: string, init: RequestInit, token: string): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  try {
    return await fetch(path, { ...init, headers, credentials: 'same-origin' });
  } catch {
    throw new OfflineError();
  }
}

/** Throws OfflineError, UnauthorizedError or ApiError (for non-2xx answers other than 401). */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new OfflineError();
  const token = await getAccessToken();
  if (!token) throw new UnauthorizedError();

  let response = await send(path, init, token);
  if (response.status === 401) {
    forgetAccessToken();
    const result = await refreshSession();
    if (result.status === 'offline') throw new OfflineError();
    const retryToken = result.status === 'ok' ? await getAccessToken() : null;
    if (!retryToken) throw new UnauthorizedError();
    response = await send(path, init, retryToken);
    if (response.status === 401) throw new UnauthorizedError();
  }
  if (!response.ok) {
    throw new ApiError(response.status, await response.json().catch(() => null));
  }
  return response;
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await apiFetch(path, init)).json() as Promise<T>;
}
