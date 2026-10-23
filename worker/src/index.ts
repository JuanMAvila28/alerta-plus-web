// /api/* router (plan section 7.9).
import type { Env } from './env';
import { errorResponse, HttpError } from './http';
import { requireUser } from './tokens';
import { googleLogin, logout, refresh } from './auth';
import { getDocuments, putDocument } from './documents';
import { deleteAccount, exportAccount, saveConsent } from './account';

export type { Env };

async function route(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  const { method } = request;

  if (pathname.startsWith('/api/auth/')) {
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (env.AUTH_LIMITER && !(await env.AUTH_LIMITER.limit({ key: ip })).success) {
      throw new HttpError(429, 'rate_limited', 'Too many requests. Try again in a minute.');
    }
    if (method === 'POST' && pathname === '/api/auth/google') return googleLogin(request, env);
    if (method === 'POST' && pathname === '/api/auth/refresh') return refresh(request, env);
    if (method === 'POST' && pathname === '/api/auth/logout') return logout(request, env);
  }

  if (method === 'POST' && pathname === '/api/consent') return saveConsent(request, env, await requireUser(request, env));
  if (method === 'GET' && pathname === '/api/documents') return getDocuments(env, await requireUser(request, env));
  const documentMatch = /^\/api\/documents\/([A-Za-z]+)$/.exec(pathname);
  if (method === 'PUT' && documentMatch) {
    return putDocument(request, env, await requireUser(request, env), documentMatch[1]!);
  }
  if (method === 'GET' && pathname === '/api/account/export') return exportAccount(env, await requireUser(request, env));
  if (method === 'DELETE' && pathname === '/api/account') return deleteAccount(env, await requireUser(request, env));

  throw new HttpError(404, 'not_found', 'Route not found.');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (error) {
      if (error instanceof HttpError) return errorResponse(error);
      console.error(error);
      return errorResponse(new HttpError(500, 'server_error', 'Unexpected error.'));
    }
  },
} satisfies ExportedHandler<Env>;
