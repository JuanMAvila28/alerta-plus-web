// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { APP_URL, startWorker, type TestWorker } from './helpers';

let w: TestWorker;

beforeAll(async () => {
  w = await startWorker();
}, 60_000);

afterAll(async () => {
  await w?.dispose();
});

async function accessToken(cookie: string) {
  const { body, cookie: next } = await w.refresh(cookie);
  return { token: body.accessToken as string, cookie: next! };
}

const home = {
  homeType: 'apartment',
  floor: 'thirdOrHigher',
  streetAccess: 'stairs',
  stairs: 'yes',
  elevator: 'no',
  emergencyExit: 'yes',
  evacuationRoute: 'yes',
  meetingPoint: 'no',
};

describe('POST /api/auth/google', () => {
  it('valid token: creates the user and redirects to /login/ok with the refresh cookie', async () => {
    const response = await w.postGoogle(await w.googleToken({ sub: 'new-user' }));
    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toBe(`${APP_URL}/login/ok`);
    const cookie = response.headers.get('Set-Cookie')!;
    expect(cookie).toMatch(/^__Host-alerta_refresh=[\w-]{43};/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
  });

  it('rejects a token signed by another key', async () => {
    const response = await w.postGoogle(await w.googleToken({}, { signWithOtherKey: true }));
    expect(response.headers.get('Location')).toBe(`${APP_URL}/login?error=google`);
    expect(response.headers.get('Set-Cookie')).toBeNull();
  });

  it('rejects a token for another client (wrong aud)', async () => {
    const response = await w.postGoogle(await w.googleToken({}, { audience: 'other.apps.googleusercontent.com' }));
    expect(response.headers.get('Location')).toBe(`${APP_URL}/login?error=google`);
  });

  it('rejects an unverified email', async () => {
    const response = await w.postGoogle(await w.googleToken({ email_verified: false }));
    expect(response.headers.get('Location')).toBe(`${APP_URL}/login?error=google`);
  });

  it('rejects a missing or different CSRF cookie', async () => {
    const token = await w.googleToken();
    expect((await w.postGoogle(token, null)).headers.get('Location')).toBe(`${APP_URL}/login?error=csrf`);
    expect((await w.postGoogle(token, 'other')).headers.get('Location')).toBe(`${APP_URL}/login?error=csrf`);
  });

  it('a second login with the same Google account reuses the user and updates the name', async () => {
    const first = await w.refresh(await w.login('same-sub'));
    const response = await w.postGoogle(await w.googleToken({ sub: 'same-sub', name: 'Ana María' }));
    const second = await w.refresh(response.headers.get('Set-Cookie')!.split(';')[0]!);
    expect((second.body.user as { id: string }).id).toBe((first.body.user as { id: string }).id);
    expect((second.body.user as { name: string }).name).toBe('Ana María');
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns tokens and user and rotates the cookie', async () => {
    const cookie = await w.login('refresh-user');
    const { response, body, cookie: next } = await w.refresh(cookie);
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      user: { email: 'ana@example.com', name: 'Ana' },
      dataConsent: false,
    });
    expect(typeof body.accessToken).toBe('string');
    expect(typeof body.license).toBe('string');
    expect(next).not.toBeNull();
    expect(next).not.toBe(cookie);
  });

  it('a rotated token used again closes every session of the user', async () => {
    const original = await w.login('reuse-user');
    const { cookie: rotated } = await w.refresh(original);
    const otherDevice = await w.login('reuse-user');

    const reuse = await w.refresh(original);
    expect(reuse.response.status).toBe(401);
    expect(reuse.body.error).toBe('token_reused');

    expect((await w.refresh(rotated!)).response.status).toBe(401);
    expect((await w.refresh(otherDevice)).response.status).toBe(401);
  });

  it('two simultaneous refreshes with the same token: only one wins', async () => {
    const cookie = await w.login('race-user');
    const results = await Promise.all([w.refresh(cookie), w.refresh(cookie)]);
    expect(results.map((r) => r.response.status).sort()).toEqual([200, 401]);
  });

  it('without a cookie or with an unknown one: 401', async () => {
    expect((await w.fetch('/api/auth/refresh', { method: 'POST' })).status).toBe(401);
    expect((await w.refresh('__Host-alerta_refresh=unknown')).response.status).toBe(401);
  });

  it('expired session: 401', async () => {
    const cookie = await w.login('expired-user');
    await w.env.DB.prepare(
      "UPDATE sessions SET expires_at = 0 WHERE user_id = (SELECT id FROM users WHERE google_sub = 'expired-user')",
    ).run();
    const { response, body } = await w.refresh(cookie);
    expect(response.status).toBe(401);
    expect(body.error).toBe('session_expired');
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the session and clears the cookie', async () => {
    const cookie = await w.login('logout-user');
    const response = await w.fetch('/api/auth/logout', { method: 'POST', headers: { Cookie: cookie } });
    expect(response.status).toBe(204);
    expect(response.headers.get('Set-Cookie')).toContain('Max-Age=0');
    const { body } = await w.refresh(cookie);
    expect(body.error).toBe('session_revoked');
  });
});

describe('/api/documents', () => {
  const put = (token: string, type: string, body: unknown) =>
    w.fetch(`/api/documents/${type}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('without a token: 401', async () => {
    expect((await w.fetch('/api/documents')).status).toBe(401);
    expect((await w.fetch('/api/documents', { headers: { Authorization: 'Bearer nope' } })).status).toBe(401);
  });

  it('creates, updates and lists a document', async () => {
    const { token } = await accessToken(await w.login('docs-user'));
    expect(await (await put(token, 'home', { content: home, updatedAt: 1, baseVersion: 0 })).json()).toEqual({
      version: 1,
    });
    const updated = await put(token, 'home', { content: { ...home, floor: 'first' }, updatedAt: 2, baseVersion: 1 });
    expect(await updated.json()).toEqual({ version: 2 });

    const list = await (await w.fetch('/api/documents', { headers: { Authorization: `Bearer ${token}` } })).json();
    expect(list).toEqual([{ type: 'home', content: { ...home, floor: 'first' }, updatedAt: 2, version: 2 }]);
  });

  it('stale version: 409 with what the server has', async () => {
    const { token } = await accessToken(await w.login('conflict-user'));
    await put(token, 'kit', { content: { checked: ['kit_1'] }, updatedAt: 10, baseVersion: 0 });
    await put(token, 'kit', { content: { checked: ['kit_1', 'kit_2'] }, updatedAt: 20, baseVersion: 1 });

    const stale = await put(token, 'kit', { content: { checked: [] }, updatedAt: 15, baseVersion: 1 });
    expect(stale.status).toBe(409);
    expect(await stale.json()).toEqual({
      error: 'conflict',
      content: { checked: ['kit_1', 'kit_2'] },
      updatedAt: 20,
      version: 2,
    });

    const created = await put(token, 'kit', { content: { checked: [] }, updatedAt: 30, baseVersion: 0 });
    expect(created.status).toBe(409);
  });

  it('validates type, content and limits', async () => {
    const { token } = await accessToken(await w.login('validation-user'));
    expect((await put(token, 'unknown', { content: {}, updatedAt: 1, baseVersion: 0 })).status).toBe(404);
    expect((await put(token, 'home', { content: { homeType: 'house' }, updatedAt: 1, baseVersion: 0 })).status).toBe(
      400,
    );
    const person = { name: 'x', relationship: 'y', phone: '1' };
    const tooMany = { people: Array.from({ length: 51 }, () => person) };
    expect((await put(token, 'contacts', { content: tooMany, updatedAt: 1, baseVersion: 0 })).status).toBe(400);
    const longName = { people: [{ ...person, name: 'x'.repeat(101) }] };
    expect((await put(token, 'contacts', { content: longName, updatedAt: 1, baseVersion: 0 })).status).toBe(400);
  });

  it("a user cannot see another user's documents", async () => {
    const a = await accessToken(await w.login('owner-a'));
    const b = await accessToken(await w.login('owner-b'));
    await put(a.token, 'checklist', { content: { checked: ['checklist_1'] }, updatedAt: 1, baseVersion: 0 });
    const list = await (await w.fetch('/api/documents', { headers: { Authorization: `Bearer ${b.token}` } })).json();
    expect(list).toEqual([]);
  });
});

describe('account', () => {
  it('consent is saved and comes back in the refresh', async () => {
    const { token, cookie } = await accessToken(await w.login('consent-user'));
    const response = await w.fetch('/api/consent', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ policyVersion: '2026-10' }),
    });
    expect(response.status).toBe(200);
    expect((await w.refresh(cookie)).body.dataConsent).toBe(true);
  });

  it('export and delete', async () => {
    const { token, cookie } = await accessToken(await w.login('delete-user'));
    const auth = { Authorization: `Bearer ${token}` };
    await w.fetch('/api/documents/home', {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: home, updatedAt: 1, baseVersion: 0 }),
    });
    await w.env.DB.prepare(
      `INSERT INTO purchases (id, user_id, provider, external_ref, product, status, created_at, updated_at)
       SELECT 'p1', id, 'test', 'ref-1', 'standard', 'paid', 1, 1 FROM users WHERE google_sub = 'delete-user'`,
    ).run();

    const exported = (await (await w.fetch('/api/account/export', { headers: auth })).json()) as Record<string, unknown>;
    expect(exported.user).toMatchObject({ email: 'ana@example.com' });
    expect(exported.documents).toEqual([{ type: 'home', content: home, updatedAt: 1 }]);
    expect(exported.purchases).toHaveLength(1);

    expect((await w.fetch('/api/account', { method: 'DELETE', headers: auth })).status).toBe(204);
    expect((await w.refresh(cookie)).response.status).toBe(401);
    const left = await w.env.DB.prepare(
      "SELECT (SELECT COUNT(*) FROM users WHERE google_sub = 'delete-user') AS users, (SELECT user_id FROM purchases WHERE id = 'p1') AS owner",
    ).first();
    expect(left).toEqual({ users: 0, owner: null });
  });
});
