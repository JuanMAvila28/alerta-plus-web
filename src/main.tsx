import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App';
import { openDb } from './lib/db';
import { getLanguage, initLanguage, translate } from './lib/i18n';
import { showToast } from './components/Toast';
import { newTexts } from './newTexts';

async function start() {
  const hasStorage = await openDb();
  await initLanguage();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );

  if (!hasStorage) {
    showToast(translate(newTexts.storage.unavailable, getLanguage()), { duration: null });
  }
}

void start();
