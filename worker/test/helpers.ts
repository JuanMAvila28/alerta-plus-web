// Runs the Worker in Node against a local D1 (wrangler's getPlatformProxy) with a fake Google.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import { getPlatformProxy } from 'wrangler';
import worker, { type Env } from '../src/index';

export const CLIENT_ID = 'test-client.apps.googleusercontent.com';
export const APP_URL = 'http://localhost:5173';
export const WOMPI = {
  publicKey: 'pub_test_alerta',
  integritySecret: 'test_integrity_alerta',
  eventsSecret: 'test_events_alerta',
};
const BASE = 'http://localhost:8787';

export interface TestWorker {
  env: Env;
  /** `env` replaces parts of the Worker's environment for this request only. */
  fetch(path: string, init?: RequestInit, env?: Partial<Env>): Promise<Response>;
  /** ID token signed by the fake Google. */
  googleToken(claims?: JWTPayload, options?: { audience?: string; signWithOtherKey?: boolean }): Promise<string>;
  /** Posts the Google form; `csrfCookie: null` sends no cookie. */
  postGoogle(credential: string, csrfCookie?: string | null): Promise<Response>;
  /** Full login: returns the refresh cookie (`name=value`). */
  login(sub?: string): Promise<string>;
  /** Refresh with a cookie; returns the response and the new cookie. */
  refresh(cookie: string): Promise<{ response: Response; cookie: string | null; body: Record<string, unknown> }>;
  dispose(): Promise<void>;
}

async function applyMigrations(db: D1Database) {
  const directory = resolve(import.meta.dirname, '../migrations');
  const sql = readdirSync(directory)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => readFileSync(resolve(directory, file), 'utf8'))
    .join(';\n')
    .replace(/--.*$/gm, '')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of ['DROP TABLE IF EXISTS purchases', 'DROP TABLE IF EXISTS documents', 'DROP TABLE IF EXISTS sessions', 'DROP TABLE IF EXISTS users', ...sql]) {
    await db.prepare(statement).run();
  }
}

export function cookieFrom(response: Response): string | null {
  const header = response.headers.get('Set-Cookie');
  const pair = header?.split(';')[0];
  return pair && !pair.endsWith('=') ? pair : null;
}

export async function startWorker(): Promise<TestWorker> {
  const proxy = await getPlatformProxy<Env>({
    configPath: resolve(import.meta.dirname, '../wrangler.toml'),
    persist: false,
  });
  await applyMigrations(proxy.env.DB);

  const google = await generateKeyPair('ES256', { extractable: true });
  const other = await generateKeyPair('ES256');
  const ours = await generateKeyPair('ES256', { extractable: true });
  const googleJwk = { ...(await exportJWK(google.publicKey)), kid: 'google-1', alg: 'ES256' };

  const env: Env = {
    ...proxy.env,
    DB: proxy.env.DB,
    GOOGLE_CLIENT_ID: CLIENT_ID,
    APP_URL,
    JWT_KID: 'test-1',
    JWT_PRIVATE_KEY: JSON.stringify(await exportJWK(ours.privateKey)),
    AUTH_LIMITER: undefined,
    CHECKOUT_LIMITER: undefined,
    WOMPI_PUBLIC_KEY: WOMPI.publicKey,
    WOMPI_INTEGRITY_SECRET: WOMPI.integritySecret,
    WOMPI_EVENTS_SECRET: WOMPI.eventsSecret,
    GOOGLE_KEYS: createLocalJWKSet({ keys: [googleJwk] }),
  };

  const fetch = (path: string, init?: RequestInit, overrides: Partial<Env> = {}) =>
    worker.fetch(new Request(BASE + path, init), { ...env, ...overrides });

  const googleToken: TestWorker['googleToken'] = (claims = {}, options = {}) =>
    new SignJWT({ email: 'ana@example.com', email_verified: true, name: 'Ana', ...claims })
      .setProtectedHeader({ alg: 'ES256', kid: 'google-1' })
      .setIssuer('https://accounts.google.com')
      .setAudience(options.audience ?? CLIENT_ID)
      .setSubject((claims.sub as string | undefined) ?? 'google-sub-1')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(options.signWithOtherKey ? other.privateKey : google.privateKey);

  const postGoogle = (credential: string, csrfCookie: string | null = 'csrf-1') => {
    const form = new FormData();
    form.set('credential', credential);
    form.set('g_csrf_token', 'csrf-1');
    const headers: HeadersInit = csrfCookie ? { Cookie: `g_csrf_token=${csrfCookie}` } : {};
    return fetch('/api/auth/google', { method: 'POST', body: form, headers });
  };

  return {
    env,
    fetch,
    googleToken,
    postGoogle,
    async login(sub = 'google-sub-1') {
      const response = await postGoogle(await googleToken({ sub }));
      const cookie = cookieFrom(response);
      if (response.status !== 303 || !cookie) throw new Error(`Login failed: ${response.headers.get('Location')}`);
      return cookie;
    },
    async refresh(cookie) {
      const response = await fetch('/api/auth/refresh', { method: 'POST', headers: { Cookie: cookie } });
      return { response, cookie: cookieFrom(response), body: (await response.json()) as Record<string, unknown> };
    },
    dispose: () => proxy.dispose(),
  };
}

export { worker };
