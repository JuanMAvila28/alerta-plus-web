import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App';
import { openDb } from './lib/db';
import { getLanguage, initLanguage, setLanguage, translate } from './lib/i18n';
import { initAuth } from './lib/auth';
import { startSync } from './lib/sync';
import type { Preferences } from './types';
import { showToast } from './components/Toast';
import { newTexts } from './newTexts';

async function start() {
  const hasStorage = await openDb();
  await initLanguage();
  await initAuth();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );

  startSync({
    // Language chosen on another device (plan section 7.5).
    onReplaced: (document) => {
      if (document.type === 'preferences') void setLanguage((document.content as Preferences).language);
    },
  });

  if (!hasStorage) {
    showToast(translate(newTexts.storage.unavailable, getLanguage()), { duration: null });
  }
}

void start();
