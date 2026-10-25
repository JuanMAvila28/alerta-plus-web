// @vitest-environment node
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { integritySignature, isValidEvent, keyEnvironment } from '../src/wompi';

// Worked examples from Wompi's documentation (Widget & Checkout Web, Eventos).
describe('Wompi signatures', () => {
  it('integrity signature matches the documented example', async () => {
    expect(
      await integritySignature('sk8-438k4-xmxm392-sn2m', 2490000, 'COP', 'prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6'),
    ).toBe('37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5');
  });

  // The page prints this concatenation, but its sample checksum (3476DDA5…) is not the SHA-256 of it:
  // the concatenation is what defines the algorithm, so the checksum here is computed from it.
  const secret = 'prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z';
  const concatenated = `1234-1610641025-49201APPROVED44900001530291411${secret}`;
  const documented = {
    data: { transaction: { id: '1234-1610641025-49201', status: 'APPROVED', amount_in_cents: 4490000 } },
    signature: {
      properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'],
      checksum: createHash('sha256').update(concatenated).digest('hex').toUpperCase(),
    },
    timestamp: 1530291411,
  };

  it('event checksum follows the documented concatenation (uppercase or lowercase)', async () => {
    expect(await isValidEvent(documented, secret)).toBe(true);
    const lowercase = { ...documented, signature: { ...documented.signature, checksum: documented.signature.checksum.toLowerCase() } };
    expect(await isValidEvent(lowercase, secret)).toBe(true);
  });

  it('rejects a changed value, another secret or a missing property', async () => {
    const declined = { ...documented, data: { transaction: { ...documented.data.transaction, status: 'DECLINED' } } };
    expect(await isValidEvent(declined, secret)).toBe(false);
    expect(await isValidEvent(documented, 'prod_events_other')).toBe(false);
    const missing = { ...documented, signature: { ...documented.signature, properties: ['transaction.nope'] } };
    expect(await isValidEvent(missing, secret)).toBe(false);
  });

  it('the public key says the environment', () => {
    expect(keyEnvironment('pub_test_abc')).toBe('test');
    expect(keyEnvironment('pub_prod_abc')).toBe('prod');
    expect(keyEnvironment('prv_test_abc')).toBeNull();
    expect(keyEnvironment(undefined)).toBeNull();
  });
});
