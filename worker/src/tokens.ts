// ALERTA+ JWTs, all ES256 (plan section 7.4).
import { importJWK, jwtVerify, SignJWT, type JWK, type CryptoKey } from 'jose';
import type { Env } from './env';
import { HttpError } from './http';

export const ISSUER = 'alerta';
export const ACCESS_AUDIENCE = 'alerta-api';
export const LICENSE_AUDIENCE = 'alerta-license';
const ACCESS_TTL = '15m';
const LICENSE_TTL = '365d';

export interface LicenseClaims {
  premium: boolean;
  product: string | null;
}

let cachedKey: { source: string; key: CryptoKey; publicKey: CryptoKey } | null = null;

async function keys(env: Env) {
  if (cachedKey?.source !== env.JWT_PRIVATE_KEY) {
    const jwk = JSON.parse(env.JWT_PRIVATE_KEY) as JWK;
    const { d: _private, ...publicJwk } = jwk;
    cachedKey = {
      source: env.JWT_PRIVATE_KEY,
      key: (await importJWK(jwk, 'ES256')) as CryptoKey,
      publicKey: (await importJWK(publicJwk, 'ES256')) as CryptoKey,
    };
  }
  return cachedKey;
}

async function sign(env: Env, claims: Record<string, unknown>, subject: string, audience: string, ttl: string) {
  const { key } = await keys(env);
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'ES256', kid: env.JWT_KID })
    .setIssuer(ISSUER)
    .setAudience(audience)
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(key);
}

/** Access token: only `sub`, nothing personal. */
export function signAccessToken(env: Env, userId: string) {
  return sign(env, {}, userId, ACCESS_AUDIENCE, ACCESS_TTL);
}

export function signLicense(env: Env, userId: string, claims: LicenseClaims) {
  return sign(env, { ...claims }, userId, LICENSE_AUDIENCE, LICENSE_TTL);
}

/** Checks `Authorization: Bearer` and returns the user id. */
export async function requireUser(request: Request, env: Env): Promise<string> {
  const header = request.headers.get('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'unauthorized', 'Missing access token.');
  try {
    const { publicKey } = await keys(env);
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: ISSUER,
      audience: ACCESS_AUDIENCE,
      algorithms: ['ES256'],
    });
    if (!payload.sub) throw new Error('No sub');
    return payload.sub;
  } catch {
    throw new HttpError(401, 'unauthorized', 'Invalid or expired access token.');
  }
}
