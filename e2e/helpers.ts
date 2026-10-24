import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, type BrowserContext, type Page } from '@playwright/test';
import { importJWK, SignJWT, type JWK } from 'jose';

const googleKey = JSON.parse(readFileSync(new URL('./google-test-key.json', import.meta.url), 'utf8')) as {
  private: JWK;
};
const BASE = 'http://localhost:4180';

/**
 * Fake speech: each sentence "ends" after a few ms, so readings finish fast and deterministically.
 * Also records what was read in `window.__spoken`.
 */
export async function useFakeSpeech(context: BrowserContext) {
  await context.addInitScript(() => {
    const spoken: string[] = [];
    (window as unknown as { __spoken: string[] }).__spoken = spoken;
    let timers: number[] = [];
    const synth = {
      speak(utterance: SpeechSynthesisUtterance) {
        timers.push(
          window.setTimeout(() => {
            spoken.push(utterance.text);
            utterance.onstart?.(new Event('start') as SpeechSynthesisEvent);
            utterance.onend?.(new Event('end') as SpeechSynthesisEvent);
          }, 20),
        );
      },
      cancel() {
        timers.forEach(clearTimeout);
        timers = [];
      },
      getVoices: () => [],
      addEventListener() {},
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  });
}

/** Google's script is not needed (we post the form ourselves) and would fail with the fake Client ID. */
export async function blockGoogle(context: BrowserContext) {
  await context.route('https://accounts.google.com/**', (route) => route.abort());
}

async function googleIdToken(sub: string, name: string, email: string) {
  return new SignJWT({ email, email_verified: true, name })
    .setProtectedHeader({ alg: 'ES256', kid: googleKey.private.kid! })
    .setIssuer('https://accounts.google.com')
    .setAudience('e2e-client.apps.googleusercontent.com')
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(await importJWK(googleKey.private, 'ES256'));
}

/**
 * What Google does after the user picks an account (ux_mode: 'redirect'):
 * posts `credential` + `g_csrf_token` to /api/auth/google, with the same CSRF value in a cookie.
 */
export async function signInWithGoogle(page: Page, { sub, name, email }: { sub: string; name: string; email: string }) {
  await page.context().addCookies([{ name: 'g_csrf_token', value: 'csrf-e2e', url: BASE }]);
  if (!page.url().startsWith(BASE)) await page.goto('/login');
  const credential = await googleIdToken(sub, name, email);
  await page.evaluate((token) => {
    const form = Object.assign(document.createElement('form'), { method: 'POST', action: '/api/auth/google' });
    for (const [name, value] of [
      ['credential', token],
      ['g_csrf_token', 'csrf-e2e'],
    ]) {
      form.append(Object.assign(document.createElement('input'), { type: 'hidden', name, value }));
    }
    document.body.append(form);
    form.submit();
  }, credential);
}

/** Signs in and accepts the data authorization; ends on the screen it was going to. */
export async function signInAndConsent(page: Page, user: { sub: string; name: string; email: string }) {
  await signInWithGoogle(page, user);
  await page.waitForURL('**/bienvenida');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'CONTINUAR' }).click();
  await expect(page).not.toHaveURL(/bienvenida/);
}

/** Runs SQL on the end-to-end database (there is no payment gateway yet: Premium is granted by hand). */
export function sql(command: string) {
  execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      'alerta',
      '--local',
      '--config',
      'worker/wrangler.e2e.toml',
      '--persist-to',
      'worker/.wrangler-e2e',
      '--command',
      command,
    ],
    { stdio: 'pipe' },
  );
}

export function grantPremium(googleSub: string) {
  sql(
    `INSERT INTO purchases (id, user_id, provider, external_ref, product, status, created_at, updated_at)
     SELECT 'e2e-${googleSub}', id, 'e2e', 'e2e-${googleSub}', 'standard', 'paid', 0, 0 FROM users WHERE google_sub = '${googleSub}'`,
  );
}

/** Data of the account saved in this browser's IndexedDB. */
export function readDocument(page: Page, type: string) {
  return page.evaluate(
    (documentType) =>
      new Promise<unknown>((resolve, reject) => {
        const open = indexedDB.open('alerta');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const request = open.result.transaction('documents').objectStore('documents').get(documentType);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        };
      }),
    type,
  );
}
