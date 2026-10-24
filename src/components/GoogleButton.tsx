import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID, GOOGLE_LOGIN_URI, isGoogleConfigured } from '../lib/config';
import { useLanguage } from '../lib/i18n';
import { rememberReturnTo } from '../lib/loginReturn';
import { newTexts } from '../newTexts';

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
let scriptPromise: Promise<void> | null = null;

/** Loads Google Identity Services once; only the screens with the button call it (plan section 7.3). */
function loadGoogleScript(): Promise<void> {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      scriptPromise = null;
      reject(new Error('Could not load Google Identity Services'));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

/**
 * Official "Sign in with Google" button. `ux_mode: 'redirect'`: popups fail in an installed iOS PWA.
 * Google posts the credential to /api/auth/google, which redirects back to /login/ok.
 */
export function GoogleButton({ returnTo = null }: { returnTo?: string | null }) {
  const { language, t } = useLanguage();
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const configured = isGoogleConfigured();

  // The button lives in Google's iframe (its clicks do not reach us) and the redirect leaves the app,
  // so the way back is saved as soon as the button is shown.
  useEffect(() => rememberReturnTo(returnTo), [returnTo]);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    loadGoogleScript()
      .then(() => {
        if (!active || !container.current || !window.google) return;
        setFailed(false);
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'redirect',
          login_uri: GOOGLE_LOGIN_URI,
          itp_support: true,
        });
        window.google.accounts.id.renderButton(container.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'center',
          width: Math.min(container.current.clientWidth || 320, 400),
          locale: language,
        });
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [configured, language, attempt]);

  useEffect(() => {
    // Retry when the connection comes back.
    const retry = () => setAttempt((n) => n + 1);
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);

  if (!configured) return <p className="text-center text-caption text-ink-muted">{t(newTexts.login.notConfigured)}</p>;
  if (failed) return <p className="text-center text-caption text-ink-muted">{t(newTexts.login.offline)}</p>;

  return <div ref={container} className="flex min-h-11 w-full justify-center" />;
}
