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
  // Phase 2: accounts and sync (plan section 7).
  accountCard: {
    invite: { es: 'Crea tu cuenta para guardar tu plan familiar', en: 'Create your account to save your family plan' },
    myAccount: { es: 'Mi cuenta', en: 'My account' },
  },
  login: {
    title: { es: 'INICIAR SESIÓN', en: 'SIGN IN' },
    description: {
      es: 'Con tu cuenta guardas tu vivienda, tus listas y tu núcleo familiar, y los recuperas en cualquier teléfono.',
      en: 'With your account you save your home, your lists and your family group, and get them back on any phone.',
    },
    emergencyHint: {
      es: '¿Es una emergencia? No necesitas cuenta:',
      en: 'Is this an emergency? You do not need an account:',
    },
    offline: {
      es: 'Necesitas conexión a internet para iniciar sesión.',
      en: 'You need an internet connection to sign in.',
    },
    notConfigured: {
      es: 'El inicio de sesión con Google aún no está configurado.',
      en: 'Google sign-in is not set up yet.',
    },
    errorGoogle: {
      es: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
      en: 'Could not sign in with Google. Please try again.',
    },
    errorSession: {
      es: 'No se pudo abrir la sesión. Inténtalo de nuevo.',
      en: 'Could not start the session. Please try again.',
    },
    entering: { es: 'Entrando…', en: 'Signing in…' },
    back: { es: 'VOLVER', en: 'BACK' },
  },
  welcome: {
    title: { es: 'BIENVENIDO A ALERTA+', en: 'WELCOME TO ALERTA+' },
    whatWeSave: {
      es: 'Para que no pierdas tu plan si cambias de teléfono, guardamos en tu cuenta: tu vivienda, tus listas (kit, botiquín y checklist), tu núcleo familiar (nombres, relación y teléfonos) y tus preferencias.',
      en: 'So you do not lose your plan if you change phones, your account stores: your home, your lists (kit, first aid kit and checklist), your family group (names, relationship and phone numbers) and your preferences.',
    },
    noLocation: {
      es: 'Tu ubicación nunca se guarda en nuestros servidores.',
      en: 'Your location is never stored on our servers.',
    },
    readPolicy: { es: 'Lee la política de privacidad', en: 'Read the privacy policy' },
    consent: {
      es: 'Autorizo el tratamiento de mis datos personales según la política de privacidad.',
      en: 'I authorize the processing of my personal data under the privacy policy.',
    },
    accept: { es: 'CONTINUAR', en: 'CONTINUE' },
    notNow: { es: 'Ahora no', en: 'Not now' },
    error: {
      es: 'No se pudo guardar tu autorización. Revisa tu conexión e inténtalo de nuevo.',
      en: 'Could not save your authorization. Check your connection and try again.',
    },
  },
  account: {
    title: { es: 'MI CUENTA', en: 'MY ACCOUNT' },
    download: { es: 'DESCARGAR MIS DATOS', en: 'DOWNLOAD MY DATA' },
    signOut: { es: 'CERRAR SESIÓN', en: 'SIGN OUT' },
    signOutPending: {
      es: 'Tienes cambios sin sincronizar. Si cierras sesión ahora, se perderán. ¿Cerrar sesión de todos modos?',
      en: 'You have changes that are not synced. If you sign out now, they will be lost. Sign out anyway?',
    },
    signOutConfirm: { es: 'SÍ, CERRAR SESIÓN', en: 'YES, SIGN OUT' },
    delete: { es: 'ELIMINAR MI CUENTA', en: 'DELETE MY ACCOUNT' },
    deleteWarning: {
      es: 'Se borrarán tu cuenta y todos tus datos guardados, en este teléfono y en el servidor. Esta acción no se puede deshacer.',
      en: 'Your account and all your saved data will be deleted, on this phone and on the server. This cannot be undone.',
    },
    deleteContinue: { es: 'CONTINUAR', en: 'CONTINUE' },
    deleteFinal: {
      es: '¿Seguro? Toca de nuevo para eliminar tu cuenta para siempre.',
      en: 'Are you sure? Tap again to delete your account forever.',
    },
    deleteConfirm: { es: 'SÍ, ELIMINAR MI CUENTA', en: 'YES, DELETE MY ACCOUNT' },
    cancel: { es: 'CANCELAR', en: 'CANCEL' },
    needsConnection: {
      es: 'Necesitas conexión a internet para hacer esto.',
      en: 'You need an internet connection to do this.',
    },
    error: { es: 'Algo salió mal. Inténtalo de nuevo.', en: 'Something went wrong. Please try again.' },
    deleted: { es: 'Tu cuenta fue eliminada.', en: 'Your account was deleted.' },
    back: { es: 'VOLVER', en: 'BACK' },
  },
  sync: {
    synced: { es: '✓ Sincronizado', en: '✓ Synced' },
    syncing: { es: 'Sincronizando…', en: 'Syncing…' },
    pending: { es: 'Cambios pendientes', en: 'Changes pending' },
    offline: {
      es: 'Sin conexión. Tus datos están guardados en este teléfono',
      en: 'Offline. Your data is saved on this phone',
    },
    expired: { es: 'Inicia sesión de nuevo para sincronizar', en: 'Sign in again to sync' },
  },
  // Phase 3: family group (plan sections 6.8, 7.8 and 9.3–9.5).
  person: {
    nameRequired: { es: 'Escribe el nombre de la persona.', en: "Enter the person's name." },
    phoneRequired: { es: 'Escribe el número telefónico.', en: 'Enter the phone number.' },
    phoneInvalid: {
      es: 'El número solo puede tener dígitos, espacios, guiones y +.',
      en: 'The number can only contain digits, spaces, hyphens and +.',
    },
    thirdPartyNotice: {
      es: 'Asegúrate de que las personas que agregas estén de acuerdo en recibir tus avisos.',
      en: 'Make sure the people you add agree to receive your alerts.',
    },
    // The Android screen relied on the system back button, which an installed iOS PWA does not have.
    back: { es: '↩️ VOLVER', en: '↩️ BACK' },
  },
  contacts: {
    limitReached: { es: 'Llegaste al máximo de 50 personas.', en: 'You reached the maximum of 50 people.' },
  },
  // Phase 4: step reader (plan section 6.6 and fix 9.6).
  reader: {
    start: { es: '▶ COMENZAR', en: '▶ START' },
    startHint: {
      es: 'Toca COMENZAR para escuchar las instrucciones en voz alta.',
      en: 'Tap START to hear the instructions aloud.',
    },
    next: { es: 'SIGUIENTE PASO ▶', en: 'NEXT STEP ▶' },
  },
  // Phase 6: Premium without payments (D2 and D3 pending).
  premium: {
    comingSoon: {
      es: 'La compra de Premium estará disponible próximamente.',
      en: 'Buying Premium will be available soon.',
    },
    restored: { es: 'Premium está activo en tu cuenta.', en: 'Premium is active on your account.' },
    notFound: {
      es: 'No encontramos una compra de Premium en tu cuenta.',
      en: 'We could not find a Premium purchase on your account.',
    },
    needsConnection: {
      es: 'Necesitas conexión a internet para restaurar la compra.',
      en: 'You need an internet connection to restore your purchase.',
    },
    correct: { es: '✓ Correcto', en: '✓ Correct' },
    incorrect: { es: '✗ Incorrecto', en: '✗ Incorrect' },
  },
  // Temporary while the later phases are built.
  underConstruction: {
    title: { es: 'Pantalla en construcción', en: 'Screen under construction' },
    back: { es: 'VOLVER', en: 'BACK' },
  },
} satisfies Record<string, Record<string, LocalizedText>>;
