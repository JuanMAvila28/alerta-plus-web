// Sync by whole document, "last writer wins" (plan section 7.6).
import { useSyncExternalStore } from 'react';
import type { DocumentContents, DocumentType, UserDocument } from '../types';
import { ApiError, apiJson, UnauthorizedError } from './api';
import { getAuthState, OfflineError } from './auth';
import { localStore, type LocalStore } from './localStore';

export interface ServerDocument {
  type: DocumentType;
  content: DocumentContents[DocumentType];
  updatedAt: number;
  version: number;
}

export type PutResult = { ok: true; version: number } | { ok: false; server: ServerDocument };

export interface SyncServer {
  list(): Promise<ServerDocument[]>;
  put(document: UserDocument): Promise<PutResult>;
}

async function putDocument(document: UserDocument, baseVersion: number): Promise<PutResult> {
  try {
    const { version } = await apiJson<{ version: number }>(`/api/documents/${document.type}`, {
      method: 'PUT',
      body: JSON.stringify({ content: document.content, updatedAt: document.updatedAt, baseVersion }),
    });
    return { ok: true, version };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 409) throw error;
    const server = error.body as Partial<ServerDocument> | null;
    // 409 without content: the server no longer has the document, so it is created again.
    if (server?.content === undefined) {
      if (baseVersion === 0) throw error;
      return putDocument(document, 0);
    }
    return { ok: false, server: { ...(server as ServerDocument), type: document.type } };
  }
}

export const apiServer: SyncServer = {
  list: () => apiJson<ServerDocument[]>('/api/documents'),
  put: (document) => putDocument(document, document.version),
};

const MAX_ATTEMPTS = 3;

/**
 * One sync round. `preferServer` (first login on a device): what the server has replaces the local copy.
 * `onReplaced` runs for each local document replaced by the server's.
 */
export async function syncOnce(
  store: LocalStore,
  server: SyncServer,
  { preferServer = false, onReplaced }: { preferServer?: boolean; onReplaced?: (document: UserDocument) => void } = {},
): Promise<void> {
  const replace = async (incoming: ServerDocument) => {
    const document: UserDocument = { ...incoming, pending: false };
    await store.putDocument(document);
    onReplaced?.(document);
  };

  const download = async () => {
    for (const incoming of await server.list()) {
      const local = await store.getDocument(incoming.type);
      const serverIsNewer = !local || (!local.pending && incoming.version > local.version);
      if (serverIsNewer || preferServer) await replace(incoming);
    }
  };

  const upload = async () => {
    for (const pending of (await store.allDocuments()).filter((document) => document.pending)) {
      let document = pending;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const result = await server.put(document);
        const latest = (await store.getDocument(document.type)) ?? document;
        const unchangedSince = latest.updatedAt === document.updatedAt;
        if (result.ok) {
          // Edited again while uploading: keep it pending, now based on the new version.
          await store.putDocument({ ...latest, version: result.version, pending: !unchangedSince });
          break;
        }
        if (!unchangedSince) {
          document = { ...latest, version: result.server.version };
          await store.putDocument(document);
        } else if (document.updatedAt > result.server.updatedAt) {
          // The local edit is newer: retry on top of the server version.
          document = { ...document, version: result.server.version };
          await store.putDocument(document);
        } else {
          await replace(result.server);
          break;
        }
      }
    }
  };

  if (preferServer) {
    await download();
    await upload();
  } else {
    await upload();
    await download();
  }
}

// ---------- App sync: status, triggers and debounce ----------

interface SyncState {
  running: boolean;
  offline: boolean;
}

let syncState: SyncState = { running: false, offline: typeof navigator !== 'undefined' && !navigator.onLine };
const subscribers = new Set<() => void>();
let onReplaced: ((document: UserDocument) => void) | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight: Promise<void> | null = null;
let again = false;

function setSyncState(next: Partial<SyncState>) {
  syncState = { ...syncState, ...next };
  subscribers.forEach((notify) => notify());
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (notify) => {
      subscribers.add(notify);
      return () => subscribers.delete(notify);
    },
    () => syncState,
  );
}

const canSync = () => {
  const { session, expired } = getAuthState();
  return session !== null && session.dataConsent && !expired;
};

/** Syncs now (one round at a time; a call during a round queues another). Never throws. */
export function syncNow(options: { preferServer?: boolean } = {}): Promise<void> {
  if (!canSync()) return Promise.resolve();
  if (inFlight) {
    again = true;
    return inFlight;
  }
  inFlight = (async () => {
    setSyncState({ running: true });
    try {
      do {
        again = false;
        await syncOnce(localStore(), apiServer, { ...options, onReplaced });
        options = {};
      } while (again && canSync());
      setSyncState({ offline: false });
    } catch (error) {
      if (error instanceof OfflineError) setSyncState({ offline: true });
      else if (!(error instanceof UnauthorizedError)) console.warn('Sync failed; will retry.', error);
    } finally {
      inFlight = null;
      setSyncState({ running: false });
    }
  })();
  return inFlight;
}

/** Syncs 2 s after the last change (debounce). */
export function scheduleSync(delay = 2000) {
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), delay);
}

/** Starts the triggers: app open, back online and back to the foreground. */
export function startSync(options: { onReplaced?: (document: UserDocument) => void } = {}) {
  onReplaced = options.onReplaced;
  window.addEventListener('online', () => {
    setSyncState({ offline: false });
    void syncNow();
  });
  window.addEventListener('offline', () => setSyncState({ offline: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow();
  });
  void syncNow();
}
