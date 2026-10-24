// Family group rules (plan sections 6.8 and 9.3–9.5) and the Contact Picker.
import type { Contact } from '../types';

export const MAX_PEOPLE = 50;
export const MAX_FIELD = 100;

export type PersonError = 'nameRequired' | 'phoneRequired' | 'phoneInvalid';

/** Name required (9.5); phone not empty and only `+`, digits, spaces and hyphens (9.3). */
export function validatePerson(person: Contact): PersonError | null {
  if (!person.name.trim()) return 'nameRequired';
  if (!person.phone.trim()) return 'phoneRequired';
  if (!/^[+\d\s-]+$/.test(person.phone.trim()) || !/\d/.test(person.phone)) return 'phoneInvalid';
  return null;
}

export function cleanPerson(person: Contact): Contact {
  return { name: person.name.trim(), relationship: person.relationship.trim(), phone: person.phone.trim() };
}

/** Adds (`index` undefined) or replaces by index, never by equality (9.4). */
export function upsertPerson(people: Contact[], person: Contact, index?: number): Contact[] {
  if (index === undefined) return [...people, person];
  return people.map((current, i) => (i === index ? person : current));
}

export function removePerson(people: Contact[], index: number): Contact[] {
  return people.filter((_, i) => i !== index);
}

interface ContactsManager {
  select(properties: ('name' | 'tel')[], options?: { multiple?: boolean }): Promise<{ name?: string[]; tel?: string[] }[]>;
}

const contactsApi = () => (navigator as Navigator & { contacts?: ContactsManager }).contacts;

/** Only Chrome on Android has it (plan F12); elsewhere the phone is typed. */
export const canPickContact = () => typeof contactsApi()?.select === 'function';

/** Opens the system contact picker. `null` if cancelled. */
export async function pickContact(): Promise<{ name: string; phone: string } | null> {
  const [contact] = (await contactsApi()?.select(['name', 'tel'], { multiple: false })) ?? [];
  if (!contact) return null;
  return { name: contact.name?.[0]?.trim() ?? '', phone: contact.tel?.[0]?.trim() ?? '' };
}
