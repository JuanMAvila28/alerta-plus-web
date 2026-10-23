import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuthState, initAuth, refreshSession } from './auth';
import { db, openDb } from './db';
import { localStore } from './localStore';
import { saveDocument } from './data';
import { syncNow } from './sync';
import type { Session } from '../types';

const session: Session = {
  key: 'current',
  user: { id: 'u1', name: 'Ana', email: 'ana@example.com', photo: null },
  license: 'license',
  dataConsent: true,
};

beforeEach(async () => {
  await openDb();
  await db.session.clear();
  await db.documents.clear();
  await localStore().putSession(session);
  await localStore().putDocument({ type: 'kit', content: { checked: ['kit_1'] }, updatedAt: 1, version: 1, pending: false });
  await initAuth();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('expired session', () => {
  it('401 on refresh: marks it expired but keeps the session and the data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'session_expired' }, { status: 401 })));
    expect((await refreshSession()).status).toBe('unauthorized');

    expect(getAuthState()).toMatchObject({ expired: true, session: { user: { id: 'u1' } } });
    expect(await db.session.get('current')).toEqual(session);
    expect(await db.documents.get('kit')).toMatchObject({ content: { checked: ['kit_1'] } });
  });

  it('offline: nothing is deleted and editing still works (the change stays pending)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))));
    expect((await refreshSession()).status).toBe('offline');
    expect(getAuthState().session).not.toBeNull();

    await saveDocument('kit', { checked: ['kit_1', 'kit_2'] });
    expect(await db.documents.get('kit')).toMatchObject({ content: { checked: ['kit_1', 'kit_2'] }, pending: true });
    await syncNow(); // fails quietly: no connection
    expect(await db.documents.get('kit')).toMatchObject({ pending: true });
    expect(await db.session.get('current')).toBeDefined();
  });

  it('another account signs in on the device: the previous account data is removed', async () => {
    const body = {
      accessToken: 'x.eyJleHAiOjk5OTk5OTk5OTl9.x',
      license: 'license-2',
      user: { id: 'u2', name: 'Luis', email: 'luis@example.com', photo: null },
      dataConsent: false,
    };
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(body)));
    expect(await refreshSession()).toEqual({ status: 'ok', previousUserId: 'u1' });
    expect(await db.documents.count()).toBe(0);
    expect(await db.session.get('current')).toMatchObject({ user: { id: 'u2' } });
  });
});
