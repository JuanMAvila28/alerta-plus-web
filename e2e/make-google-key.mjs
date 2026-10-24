// Creates the fake "Google" key the end-to-end tests sign ID tokens with (test-only, not a secret).
import { exportJWK, generateKeyPair } from 'jose';
import { writeFileSync } from 'node:fs';

const { publicKey, privateKey } = await generateKeyPair('ES256', { extractable: true });
const kid = 'e2e-google';
writeFileSync(
  new URL('./google-test-key.json', import.meta.url),
  `${JSON.stringify(
    {
      private: { ...(await exportJWK(privateKey)), kid, alg: 'ES256' },
      jwks: { keys: [{ ...(await exportJWK(publicKey)), kid, alg: 'ES256', use: 'sig' }] },
    },
    null,
    2,
  )}\n`,
);
