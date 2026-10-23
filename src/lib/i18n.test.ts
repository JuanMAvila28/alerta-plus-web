import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLanguage, initLanguage, setLanguage, translate } from './i18n';
import { db, openDb } from './db';

describe('translate', () => {
  it('uses the requested language and replaces variables', () => {
    const text = { es: 'Paso {current} de {total}', en: 'Step {current} of {total}' };
    expect(translate(text, 'es', { current: 1, total: 8 })).toBe('Paso 1 de 8');
    expect(translate(text, 'en', { current: 2, total: 8 })).toBe('Step 2 of 8');
  });

  it('shows Spanish when `en` is null', () => {
    expect(translate({ es: 'Política de privacidad', en: null }, 'en')).toBe('Política de privacidad');
  });

  it('leaves variables that are not passed untouched', () => {
    expect(translate({ es: 'Hola {name}', en: null }, 'es', {})).toBe('Hola {name}');
  });
});

describe('device language', () => {
  beforeEach(async () => {
    await openDb();
    await db.localPreferences.clear();
  });

  it('without a saved preference uses the browser language', async () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    await initLanguage();
    expect(getLanguage()).toBe('en');
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-CO');
    await initLanguage();
    expect(getLanguage()).toBe('es');
    vi.restoreAllMocks();
  });

  it('saves the chosen language and updates <html lang>', async () => {
    await setLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    expect(await db.localPreferences.get('language')).toEqual({ key: 'language', value: 'en' });
    await setLanguage('es');
    await initLanguage();
    expect(getLanguage()).toBe('es');
    expect(document.documentElement.lang).toBe('es-CO');
  });
});
