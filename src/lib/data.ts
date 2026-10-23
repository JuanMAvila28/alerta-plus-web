// Read and write user data, always through the local store (plan section 7.5).
import { homeContent } from '../content';
import type { DocumentContents, DocumentType, Home } from '../types';
import { getLanguage } from './i18n';
import { localStore, useLocalQuery } from './localStore';
import { scheduleSync } from './sync';

export function defaultContent<T extends DocumentType>(type: T): DocumentContents[T] {
  const defaults: { [K in DocumentType]: () => DocumentContents[K] } = {
    home: () => Object.fromEntries(homeContent.fields.map((field) => [field.key, field.default])) as Home,
    contacts: () => ({ people: [] }),
    kit: () => ({ checked: [] }),
    firstAidKit: () => ({ checked: [] }),
    checklist: () => ({ checked: [] }),
    preferences: () => ({ language: getLanguage(), shareDiscount: false }),
  };
  return defaults[type]();
}

/** Document content (the default until something is saved). `undefined` while loading. */
export function useDocument<T extends DocumentType>(type: T): DocumentContents[T] | undefined {
  return useLocalQuery(
    async (store) => ((await store.getDocument(type))?.content as DocumentContents[T] | undefined) ?? defaultContent(type),
    [type],
  );
}

/** Saves on the device right away and schedules the sync. */
export async function saveDocument<T extends DocumentType>(type: T, content: DocumentContents[T]): Promise<void> {
  const store = localStore();
  const existing = await store.getDocument(type);
  // Strictly increasing, so sync can tell an edit made during an upload.
  const updatedAt = Math.max(Date.now(), (existing?.updatedAt ?? 0) + 1);
  await store.putDocument({ type, content, updatedAt, version: existing?.version ?? 0, pending: true });
  scheduleSync();
}

/** Number of changes not yet on the server. */
export function usePendingCount(): number {
  return useLocalQuery(async (store) => (await store.allDocuments()).filter((document) => document.pending).length) ?? 0;
}
