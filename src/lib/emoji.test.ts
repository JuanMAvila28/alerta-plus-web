import { describe, expect, it } from 'vitest';
import { uiText } from '../content';
import { withoutEmoji } from './emoji';

describe('withoutEmoji', () => {
  it('drops the leading emoji and its space', () => {
    expect(withoutEmoji('🏠 CONFIGURAR MI VIVIENDA')).toBe('CONFIGURAR MI VIVIENDA');
    expect(withoutEmoji('↩️ VOLVER AL INICIO')).toBe('VOLVER AL INICIO');
    expect(withoutEmoji('👨‍👩‍👧‍👦 MI NÚCLEO')).toBe('MI NÚCLEO');
  });

  it('leaves texts without emoji untouched', () => {
    expect(withoutEmoji('ESTÁ TEMBLANDO')).toBe('ESTÁ TEMBLANDO');
    expect(withoutEmoji('1 de 8')).toBe('1 de 8');
  });

  it('cleans every main menu entry', () => {
    for (const text of Object.values(uiText.menu)) {
      expect(withoutEmoji(text.es)).toMatch(/^[A-ZÁÉÍÓÚÑa-z]/);
    }
  });
});
