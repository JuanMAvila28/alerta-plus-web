// Offline license check (plan section 7.4).
import { compactVerify, createLocalJWKSet, decodeJwt } from 'jose';
import licenseKeys from './license-keys.json';

export interface License {
  premium: boolean;
  product: string | null;
  userId: string;
  expiresAt: number | null;
}

const keys = createLocalJWKSet(licenseKeys as Parameters<typeof createLocalJWKSet>[0]);

/**
 * Verifies the signature, issuer and audience of the license JWT with the bundled public keys.
 * `exp` is not enforced: someone months without internet keeps Premium; the app renews it when online.
 */
export async function verifyLicense(token: string | null | undefined): Promise<License | null> {
  if (!token) return null;
  try {
    await compactVerify(token, keys, { algorithms: ['ES256'] });
    const claims = decodeJwt(token);
    if (claims.iss !== 'alerta' || claims.aud !== 'alerta-license' || !claims.sub) return null;
    return {
      premium: claims.premium === true,
      product: typeof claims.product === 'string' ? claims.product : null,
      userId: claims.sub,
      expiresAt: claims.exp ? claims.exp * 1000 : null,
    };
  } catch {
    return null;
  }
}
