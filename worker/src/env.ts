import type { JWTVerifyGetKey } from 'jose';

export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  JWT_KID: string;
  /** Origin of the app, for the redirect after login (e.g. http://localhost:5173). */
  APP_URL: string;
  /** ES256 private JWK as JSON (secret). */
  JWT_PRIVATE_KEY: string;
  AUTH_LIMITER?: RateLimit;
  /** Tests only: replaces Google's public keys. */
  GOOGLE_KEYS?: JWTVerifyGetKey;
}
