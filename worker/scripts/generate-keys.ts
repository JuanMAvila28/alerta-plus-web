// Generates an ES256 key pair for ALERTA+ JWTs (plan section 7.4).
//   npx tsx worker/scripts/generate-keys.ts <kid>
// Prints the private JWK (for `wrangler secret put JWT_PRIVATE_KEY` or worker/.dev.vars) and
// adds the public JWK to src/lib/license-keys.json, which the app uses to verify the license offline.
import { exportJWK, generateKeyPair } from 'jose';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const kid = process.argv[2];
if (!kid) {
  console.error('Usage: npx tsx worker/scripts/generate-keys.ts <kid>');
  process.exit(1);
}

const { publicKey, privateKey } = await generateKeyPair('ES256', { extractable: true });
const privateJwk = { ...(await exportJWK(privateKey)), kid, alg: 'ES256' };
const publicJwk = { ...(await exportJWK(publicKey)), kid, alg: 'ES256', use: 'sig' };

const keysPath = resolve('src/lib/license-keys.json');
let keys: { keys: { kid?: string }[] } = { keys: [] };
try {
  keys = JSON.parse(readFileSync(keysPath, 'utf8'));
} catch {
  // First key.
}
keys.keys = [...keys.keys.filter((key) => key.kid !== kid), publicJwk];
writeFileSync(keysPath, `${JSON.stringify(keys, null, 2)}\n`);

console.log(`Public key "${kid}" added to src/lib/license-keys.json.`);
console.log('Private key (keep it secret; set JWT_KID to the same kid):\n');
console.log(JSON.stringify(privateJwk));
