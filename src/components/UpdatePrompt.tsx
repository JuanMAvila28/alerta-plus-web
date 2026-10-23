import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { getLanguage, translate } from '../lib/i18n';
import { newTexts } from '../newTexts';
import { showToast } from './Toast';

/**
 * Registers the service worker and tells the user when a new version is ready.
 * The app never reloads by itself: updating mid-protocol would cut the reading off.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!needRefresh) return;
    const language = getLanguage();
    return showToast(translate(newTexts.update.available, language), {
      duration: null,
      action: {
        label: translate(newTexts.update.update, language),
        onClick: () => void updateServiceWorker(true),
      },
    });
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
    if (offlineReady) showToast(translate(newTexts.update.offlineReady, getLanguage()));
  }, [offlineReady]);

  return null;
}
