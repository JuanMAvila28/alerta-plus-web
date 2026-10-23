// Consent, export and account deletion (plan section 7.8).
import type { Env } from './env';
import { HttpError, json, readJson } from './http';
import { consentBody } from './schemas';
import { listDocuments } from './documents';
import { REFRESH_COOKIE } from './auth';

/** POST /api/consent */
export async function saveConsent(request: Request, env: Env, userId: string): Promise<Response> {
  const body = consentBody.safeParse(await readJson(request));
  if (!body.success) throw new HttpError(400, 'invalid_body', body.error.message);
  const now = Date.now();
  await env.DB.prepare('UPDATE users SET data_consent_at = ?, policy_version = ?, updated_at = ? WHERE id = ?')
    .bind(now, body.data.policyVersion, now, userId)
    .run();
  return json({ dataConsentAt: now });
}

/** GET /api/account/export: everything stored about the user, as JSON. */
export async function exportAccount(env: Env, userId: string): Promise<Response> {
  const user = await env.DB.prepare(
    'SELECT email, name, photo, data_consent_at, policy_version, created_at, updated_at FROM users WHERE id = ?',
  )
    .bind(userId)
    .first();
  if (!user) throw new HttpError(404, 'not_found', 'Account not found.');
  const sessions = await env.DB.prepare(
    'SELECT created_at, expires_at, revoked_at, agent FROM sessions WHERE user_id = ? ORDER BY created_at',
  )
    .bind(userId)
    .all();
  const purchases = await env.DB.prepare(
    'SELECT provider, product, amount, currency, status, created_at, updated_at FROM purchases WHERE user_id = ?',
  )
    .bind(userId)
    .all();
  const documents = (await listDocuments(env, userId)).map((row) => ({
    type: row.type,
    content: JSON.parse(row.content) as unknown,
    updatedAt: row.updated_at,
  }));

  return json(
    { exportedAt: Date.now(), user, documents, sessions: sessions.results, purchases: purchases.results },
    200,
    { 'Content-Disposition': 'attachment; filename="alerta-mis-datos.json"' },
  );
}

/** DELETE /api/account: removes user, sessions and documents; purchases keep `user_id = NULL`. */
export async function deleteAccount(env: Env, userId: string): Promise<Response> {
  await env.DB.batch([
    env.DB.prepare('UPDATE purchases SET user_id = NULL WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM documents WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId),
  ]);
  return new Response(null, {
    status: 204,
    headers: {
      'Set-Cookie': `${REFRESH_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
      'Cache-Control': 'no-store',
    },
  });
}
