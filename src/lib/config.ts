// Build-time settings (see .env.example).

/** OAuth Client ID from Google Cloud (not secret, plan section 7.3). */
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

/** Where Google posts the login. Same origin in production; the Worker's port in development. */
export const GOOGLE_LOGIN_URI: string =
  import.meta.env.VITE_GOOGLE_LOGIN_URI || `${globalThis.location?.origin ?? ''}/api/auth/google`;

export const isGoogleConfigured = () =>
  GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com') && !GOOGLE_CLIENT_ID.startsWith('REPLACE');

/** Version of the privacy policy the user authorizes (plan section 7.8). Change it with each new policy. */
export const POLICY_VERSION = '2026-10';
