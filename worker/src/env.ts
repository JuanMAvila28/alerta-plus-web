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
  CHECKOUT_LIMITER?: RateLimit;
  /** Wompi public key (not secret): pub_test_… in Sandbox, pub_prod_… in production. Without it there are no payments. */
  WOMPI_PUBLIC_KEY?: string;
  /** Secret for the checkout integrity signature (test_integrity_… / prod_integrity_…). */
  WOMPI_INTEGRITY_SECRET?: string;
  /** Secret for the checksum of Wompi's events (test_events_… / prod_events_…). */
  WOMPI_EVENTS_SECRET?: string;
  /** Unit tests only: replaces Google's public keys. */
  GOOGLE_KEYS?: JWTVerifyGetKey;
  /** End-to-end tests only (JWKS as JSON). Never set it in production: it would trust other keys than Google's. */
  GOOGLE_TEST_JWKS?: string;
}
