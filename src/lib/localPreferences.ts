// Device-only flags that do not need an account (kept when signing out).
import { db, isDbAvailable } from './db';

const memory = new Map<string, unknown>();

export async function getFlag(key: 'thirdPartyNoticeSeen'): Promise<boolean> {
  if (!isDbAvailable()) return memory.get(key) === true;
  try {
    return (await db.localPreferences.get(key))?.value === true;
  } catch {
    return false;
  }
}

export async function setFlag(key: 'thirdPartyNoticeSeen', value: boolean): Promise<void> {
  memory.set(key, value);
  if (!isDbAvailable()) return;
  try {
    await db.localPreferences.put({ key, value });
  } catch (error) {
    console.warn('Could not save a local preference.', error);
  }
}
