import { useSyncExternalStore } from 'react';
import type { Language, LocalizedText } from '../types';
import { db, isDbAvailable } from './db';

export type Variables = Record<string, string | number>;

/** Returns the text in the given language (Spanish when `en` is null) with `{variables}` replaced. */
export function translate(text: LocalizedText, language: Language, variables?: Variables): string {
  const base = text[language] ?? text.es;
  if (!variables) return base;
  return base.replace(/\{(\w+)\}/g, (original, name: string) => (name in variables ? String(variables[name]) : original));
}

export function browserLanguage(): Language {
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
}

export const HTML_LANG: Record<Language, string> = { es: 'es-CO', en: 'en' };

let currentLanguage: Language = browserLanguage();
const subscribers = new Set<() => void>();

function apply(language: Language) {
  currentLanguage = language;
  document.documentElement.lang = HTML_LANG[language];
  subscribers.forEach((notify) => notify());
}

/** Loads the language saved on the device; falls back to the browser language. */
export async function initLanguage(): Promise<void> {
  let saved: Language | undefined;
  if (isDbAvailable()) {
    try {
      saved = (await db.localPreferences.get('language'))?.value;
    } catch (error) {
      console.warn('Could not read the saved language.', error);
    }
  }
  apply(saved ?? browserLanguage());
}

/** Switches the language immediately and saves it on the device (no account needed). */
export async function setLanguage(language: Language): Promise<void> {
  apply(language);
  if (!isDbAvailable()) return;
  try {
    await db.localPreferences.put({ key: 'language', value: language });
  } catch (error) {
    console.warn('Could not save the language.', error);
  }
}

export function getLanguage(): Language {
  return currentLanguage;
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  return () => subscribers.delete(notify);
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, getLanguage);
  const t = (text: LocalizedText, variables?: Variables) => translate(text, language, variables);
  return { language, t, setLanguage };
}
