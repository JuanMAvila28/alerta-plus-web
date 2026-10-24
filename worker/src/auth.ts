// Google login, refresh-token rotation and logout (plan sections 7.3 and 7.4).
import { createLocalJWKSet, createRemoteJWKSet, jwtVerify, type JSONWebKeySet, type JWTVerifyGetKey } from 'jose';
import type { Env } from './env';
import { getCookie, HttpError, json, redirect } from './http';
import { signAccessToken, signLicense, type LicenseClaims } from './tokens';

export const REFRESH_COOKIE = '__Host-alerta_refresh';
const REFRESH_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

function googleVerificationKeys(env: Env): JWTVerifyGetKey {
  if (env.GOOGLE_KEYS) return env.GOOGLE_KEYS;
  if (env.GOOGLE_TEST_JWKS) return createLocalJWKSet(JSON.parse(env.GOOGLE_TEST_JWKS) as JSONWebKeySet);
  return googleKeys;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  photo: string | null;
  data_consent_at: number | null;
}

interface SessionRow {
  id: string;
  user_id: string;
  expires_at: number;
  revoked_at: number | null;
  replaced_by: string | null;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function refreshCookie(token: string, maxAgeSeconds: number): string {
  return `${REFRESH_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;
}

const clearCookie = () => refreshCookie('', 0);

/** Creates a session and returns the refresh token (only its hash is stored). */
async function createSession(
  env: Env,
  userId: string,
  agent: string | null,
  id: string = crypto.randomUUID(),
): Promise<{ id: string; token: string }> {
  const token = randomToken();
  const now = Date.now();
  await env.DB.prepare(
    'INSERT INTO sessions (id, user_id, refresh_hash, created_at, expires_at, agent) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, userId, await sha256(token), now, now + REFRESH_TTL_MS, agent?.slice(0, 120) ?? null)
    .run();
  return { id, token };
}

async function licenseClaims(env: Env, userId: string): Promise<LicenseClaims> {
  const purchase = await env.DB.prepare(
    "SELECT product FROM purchases WHERE user_id = ? AND status = 'paid' ORDER BY updated_at DESC LIMIT 1",
  )
    .bind(userId)
    .first<{ product: string }>();
  return { premium: purchase !== null, product: purchase?.product ?? null };
}

/** POST /api/auth/google: form posted by Google Identity Services (`ux_mode: 'redirect'`). */
export async function googleLogin(request: Request, env: Env): Promise<Response> {
  const fail = (reason: string) => redirect(`${env.APP_URL}/login?error=${reason}`);

  const form = await request.formData().catch(() => null);
  const credential = form?.get('credential');
  const csrfField = form?.get('g_csrf_token');
  const csrfCookie = getCookie(request, 'g_csrf_token');
  if (typeof csrfField !== 'string' || !csrfCookie || csrfField !== csrfCookie) return fail('csrf');
  if (typeof credential !== 'string') return fail('google');

  let claims;
  try {
    ({ payload: claims } = await jwtVerify(credential, googleVerificationKeys(env), {
      issuer: GOOGLE_ISSUERS,
      audience: env.GOOGLE_CLIENT_ID,
    }));
  } catch {
    return fail('google');
  }
  if (!claims.sub || claims.email_verified !== true || typeof claims.email !== 'string') return fail('google');

  const now = Date.now();
  const name = typeof claims.name === 'string' ? claims.name : null;
  const photo = typeof claims.picture === 'string' ? claims.picture : null;
  const user = await env.DB.prepare(
    `INSERT INTO users (id, google_sub, email, name, photo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (google_sub) DO UPDATE SET email = excluded.email, name = excluded.name, photo = excluded.photo,
       updated_at = excluded.updated_at
     RETURNING id`,
  )
    .bind(crypto.randomUUID(), claims.sub, claims.email, name, photo, now, now)
    .first<{ id: string }>();
  if (!user) throw new HttpError(500, 'server_error', 'Could not save the user.');

  const session = await createSession(env, user.id, request.headers.get('User-Agent'));
  return redirect(`${env.APP_URL}/login/ok`, { 'Set-Cookie': refreshCookie(session.token, REFRESH_TTL_MS / 1000) });
}

/** POST /api/auth/refresh: rotates the refresh token and returns access token, license and user. */
export async function refresh(request: Request, env: Env): Promise<Response> {
  const unauthorized = (code: string, message: string) =>
    json({ error: code, message }, 401, { 'Set-Cookie': clearCookie() });

  const token = getCookie(request, REFRESH_COOKIE);
  if (!token) return unauthorized('no_session', 'No session.');

  const session = await env.DB.prepare(
    'SELECT id, user_id, expires_at, revoked_at, replaced_by FROM sessions WHERE refresh_hash = ?',
  )
    .bind(await sha256(token))
    .first<SessionRow>();
  if (!session) return unauthorized('no_session', 'Unknown session.');

  const now = Date.now();
  const reused = async () => {
    // An already rotated token came back: it may have been stolen. Revoke every session of the user.
    await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL')
      .bind(now, session.user_id)
      .run();
    return unauthorized('token_reused', 'Refresh token reused; all sessions were closed.');
  };
  if (session.replaced_by) return reused();
  if (session.revoked_at !== null) return unauthorized('session_revoked', 'Session closed.');
  if (session.expires_at <= now) return unauthorized('session_expired', 'Session expired.');

  // Claim the rotation atomically: if two requests carry the same token, only one wins.
  const nextId = crypto.randomUUID();
  const claim = await env.DB.prepare(
    'UPDATE sessions SET revoked_at = ?, replaced_by = ? WHERE id = ? AND revoked_at IS NULL AND replaced_by IS NULL',
  )
    .bind(now, nextId, session.id)
    .run();
  if (claim.meta.changes === 0) return reused();

  const user = await env.DB.prepare('SELECT id, email, name, photo, data_consent_at FROM users WHERE id = ?')
    .bind(session.user_id)
    .first<UserRow>();
  if (!user) return unauthorized('no_session', 'The account no longer exists.');

  const next = await createSession(env, user.id, request.headers.get('User-Agent'), nextId);

  return json(
    {
      accessToken: await signAccessToken(env, user.id),
      license: await signLicense(env, user.id, await licenseClaims(env, user.id)),
      user: { id: user.id, name: user.name, email: user.email, photo: user.photo },
      dataConsent: user.data_consent_at !== null,
    },
    200,
    { 'Set-Cookie': refreshCookie(next.token, REFRESH_TTL_MS / 1000) },
  );
}

/** POST /api/auth/logout: revokes the session and clears the cookie. */
export async function logout(request: Request, env: Env): Promise<Response> {
  const token = getCookie(request, REFRESH_COOKIE);
  if (token) {
    await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE refresh_hash = ? AND revoked_at IS NULL')
      .bind(Date.now(), await sha256(token))
      .run();
  }
  return new Response(null, { status: 204, headers: { 'Set-Cookie': clearCookie(), 'Cache-Control': 'no-store' } });
}
