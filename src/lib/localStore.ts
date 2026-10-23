// Account data on the device: session and documents (plan section 7.5).
// IndexedDB when available; otherwise memory, so the app keeps working (and says so).
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { DocumentType, Session, UserDocument } from '../types';
import { db, isDbAvailable, type AlertaDatabase } from './db';

export interface LocalStore {
  getSession(): Promise<Session | undefined>;
  putSession(session: Session): Promise<void>;
  getDocument(type: DocumentType): Promise<UserDocument | undefined>;
  putDocument(document: UserDocument): Promise<void>;
  allDocuments(): Promise<UserDocument[]>;
  /** Removes session and documents; keeps the local preferences (language). */
  clearAccountData(): Promise<void>;
}

export function dexieStore(database: AlertaDatabase): LocalStore {
  return {
    getSession: () => database.session.get('current'),
    putSession: async (session) => {
      await database.session.put(session);
    },
    getDocument: (type) => database.documents.get(type),
    putDocument: async (document) => {
      await database.documents.put(document);
    },
    allDocuments: () => database.documents.toArray(),
    clearAccountData: () => database.transaction('rw', database.session, database.documents, async () => {
      await database.session.clear();
      await database.documents.clear();
    }),
  };
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function memoryStore(): LocalStore {
  let session: Session | undefined;
  const documents = new Map<DocumentType, UserDocument>();
  return {
    getSession: async () => session,
    putSession: async (next) => {
      session = next;
      notify();
    },
    getDocument: async (type) => documents.get(type),
    putDocument: async (document) => {
      documents.set(document.type, document);
      notify();
    },
    allDocuments: async () => [...documents.values()],
    clearAccountData: async () => {
      session = undefined;
      documents.clear();
      notify();
    },
  };
}

let current: LocalStore | null = null;

/** The device's store. Call after `openDb()`. */
export function localStore(): LocalStore {
  current ??= isDbAvailable() ? dexieStore(db) : memoryStore();
  return current;
}

function useMemoryQuery<T>(query: () => Promise<T>, deps: unknown[]): T | undefined {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    let active = true;
    const run = () => void query().then((result) => active && setValue(() => result));
    run();
    listeners.add(run);
    return () => {
      active = false;
      listeners.delete(run);
    };
  }, deps);
  return value;
}

/** Re-runs `query` whenever local data changes (also from other tabs with IndexedDB). */
export function useLocalQuery<T>(query: (store: LocalStore) => Promise<T>, deps: unknown[] = []): T | undefined {
  // isDbAvailable() is fixed once the app starts, so the hook order never changes.
  if (isDbAvailable()) {
    return useLiveQuery(() => query(localStore()), deps);
  }
  return useMemoryQuery(() => query(localStore()), deps);
}
