import { describe, expect, it } from 'vitest';
import { generateKeyPair, SignJWT } from 'jose';
import { verifyLicense } from './license';

describe('verifyLicense', () => {
  it('rejects a license not signed by ALERTA+ (no free Premium by editing IndexedDB)', async () => {
    const { privateKey } = await generateKeyPair('ES256');
    const forged = await new SignJWT({ premium: true, product: 'standard' })
      .setProtectedHeader({ alg: 'ES256', kid: 'dev-1' })
      .setIssuer('alerta')
      .setAudience('alerta-license')
      .setSubject('u1')
      .setIssuedAt()
      .setExpirationTime('1y')
      .sign(privateKey);
    expect(await verifyLicense(forged)).toBeNull();
  });

  it('returns null for empty or malformed values', async () => {
    expect(await verifyLicense(undefined)).toBeNull();
    expect(await verifyLicense('')).toBeNull();
    expect(await verifyLicense('not.a.jwt')).toBeNull();
  });
});
