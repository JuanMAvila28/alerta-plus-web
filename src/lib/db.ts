import Dexie, { type EntityTable } from 'dexie';
import type { LocalPreference, Session, UserDocument } from '../types';

export class AlertaDatabase extends Dexie {
  session!: EntityTable<Session, 'key'>;
  documents!: EntityTable<UserDocument, 'type'>;
  localPreferences!: EntityTable<LocalPreference, 'key'>;

  constructor(name = 'alerta') {
    super(name);
    this.version(1).stores({
      session: 'key',
      documents: 'type',
      localPreferences: 'key',
    });
  }
}

export const db = new AlertaDatabase();

let available: boolean | null = null;

/**
 * Opens IndexedDB and asks for persistent storage. Returns `false` when the browser
 * does not allow IndexedDB (e.g. old private mode): the app keeps working in memory.
 */
export async function openDb(): Promise<boolean> {
  if (available !== null) return available;
  try {
    await db.open();
    available = true;
  } catch (error) {
    console.warn('IndexedDB unavailable; working in memory.', error);
    available = false;
  }
  try {
    await navigator.storage?.persist?.();
  } catch {
    // Asking for persistence is optional.
  }
  return available;
}

export function isDbAvailable(): boolean {
  return available === true;
}
