// Texts that do not exist in ui-text.json (plan rule 0.7).
// PENDING APPROVAL: do not move them into ui-text.json until they are approved.
import type { LocalizedText } from './types';

export const newTexts = {
  update: {
    available: { es: 'Hay una nueva versión de ALERTA+.', en: 'A new version of ALERTA+ is available.' },
    update: { es: 'ACTUALIZAR', en: 'UPDATE' },
    offlineReady: { es: 'ALERTA+ ya funciona sin conexión.', en: 'ALERTA+ now works offline.' },
  },
  storage: {
    unavailable: {
      es: 'Este navegador no permite guardar datos. Lo que cambies se perderá al cerrar la app.',
      en: 'This browser cannot save data. Your changes will be lost when you close the app.',
    },
  },
  common: {
    close: { es: 'Cerrar', en: 'Close' },
    loading: { es: 'Cargando…', en: 'Loading…' },
  },
  // Temporary while the later phases are built.
  underConstruction: {
    title: { es: 'Pantalla en construcción', en: 'Screen under construction' },
    back: { es: 'VOLVER', en: 'BACK' },
  },
} satisfies Record<string, Record<string, LocalizedText>>;
