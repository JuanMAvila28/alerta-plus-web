// Session: user and license in the local store, access token only in memory (plan section 7.4).
// An expired session never blocks the app or deletes local data (plan rule 7.1.5).
import { useSyncExternalStore } from 'react';
import { decodeJwt } from 'jose';
import type { Session, User } from '../types';
import { localStore } from './localStore';

export class OfflineError extends Error {
  constructor() {
    super('No connection');
  }
}

interface AuthState {
  /** Account on this device. Having one is what "signed in" means, even without connection. */
  session: Session | null;
  /** The server rejected the session: local data stays, sync waits for a new login. */
  expired: boolean;
}

let state: AuthState = { session: null, expired: false };
const subscribers = new Set<() => void>();
let accessToken: { token: string; expiresAt: number } | null = null;
let refreshing: Promise<RefreshResult> | null = null;

function setState(next: Partial<AuthState>) {
  state = { ...state, ...next };
  subscribers.forEach((notify) => notify());
}

export const getAuthState = () => state;

export function useAuth(): AuthState {
  return useSyncExternalStore(
    (notify) => {
      subscribers.add(notify);
      return () => subscribers.delete(notify);
    },
    getAuthState,
  );
}

export async function initAuth(): Promise<void> {
  try {
    setState({ session: (await localStore().getSession()) ?? null, expired: false });
  } catch (error) {
    console.warn('Could not read the session.', error);
  }
}

interface RefreshBody {
  accessToken: string;
  license: string;
  user: User;
  dataConsent: boolean;
}

export type RefreshResult = { status: 'ok'; previousUserId: string | null } | { status: 'unauthorized' | 'offline' };

async function requestRefresh(): Promise<RefreshResult> {
  let response: Response;
  try {
    response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' });
  } catch {
    return { status: 'offline' };
  }
  if (response.status === 401) {
    accessToken = null;
    if (state.session) setState({ expired: true });
    return { status: 'unauthorized' };
  }
  if (!response.ok) return { status: 'offline' };

  const body = (await response.json()) as RefreshBody;
  const previousUserId = state.session?.user.id ?? null;
  const store = localStore();
  // Another account signed in on this device: the previous one's data must not leak into it.
  if (previousUserId && previousUserId !== body.user.id) await store.clearAccountData();
  const session: Session = { key: 'current', user: body.user, license: body.license, dataConsent: body.dataConsent };
  await store.putSession(session);
  accessToken = { token: body.accessToken, expiresAt: (decodeJwt(body.accessToken).exp ?? 0) * 1000 };
  setState({ session, expired: false });
  return { status: 'ok', previousUserId };
}

/**
 * Rotates the refresh cookie. Calls are shared within the tab and serialized across tabs
 * (Web Locks), because reusing a rotated token closes every session of the user.
 */
export function refreshSession(): Promise<RefreshResult> {
  refreshing ??= (
    navigator.locks ? navigator.locks.request('alerta-auth-refresh', requestRefresh) : requestRefresh()
  ).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** A valid access token, refreshing it if needed. `null` = no valid session. */
export async function getAccessToken(): Promise<string | null> {
  if (accessToken && accessToken.expiresAt - Date.now() > 60_000) return accessToken.token;
  const result = await refreshSession();
  if (result.status === 'offline') throw new OfflineError();
  return result.status === 'ok' ? accessToken!.token : null;
}

export function forgetAccessToken() {
  accessToken = null;
}

export async function setDataConsent(): Promise<void> {
  if (!state.session) return;
  const session = { ...state.session, dataConsent: true };
  await localStore().putSession(session);
  setState({ session });
}

/** Removes the account from this device (session and documents; language stays). */
export async function clearLocalAccount(): Promise<void> {
  accessToken = null;
  await localStore().clearAccountData();
  setState({ session: null, expired: false });
}

/** Closes the session on the server (if reachable) and on this device. */
export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch {
    // Offline: the cookie stays until it expires, but the device forgets the account anyway.
  }
  await clearLocalAccount();
}
