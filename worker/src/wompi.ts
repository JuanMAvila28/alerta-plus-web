// Wompi: Web Checkout link and event checksum.
import { sha256 } from './auth';

/** Same URL in Sandbox and production: the public key decides the environment. */
export const CHECKOUT_URL = 'https://checkout.wompi.co/p/';

export type WompiEnvironment = 'test' | 'prod';

/** pub_test_… belongs to Sandbox, pub_prod_… to production. */
export function keyEnvironment(publicKey: string | undefined): WompiEnvironment | null {
  if (publicKey?.startsWith('pub_test_')) return 'test';
  if (publicKey?.startsWith('pub_prod_')) return 'prod';
  return null;
}

/** SHA-256 of reference + amount in cents + currency + integrity secret. */
export function integritySignature(reference: string, amountInCents: number, currency: string, secret: string) {
  return sha256(`${reference}${amountInCents}${currency}${secret}`);
}

export interface CheckoutParams {
  publicKey: string;
  integritySecret: string;
  reference: string;
  amountInCents: number;
  currency: string;
  redirectUrl: string;
  email: string;
}

export async function checkoutUrl(params: CheckoutParams): Promise<string> {
  const query = new URLSearchParams({
    'public-key': params.publicKey,
    currency: params.currency,
    'amount-in-cents': String(params.amountInCents),
    reference: params.reference,
    'signature:integrity': await integritySignature(
      params.reference,
      params.amountInCents,
      params.currency,
      params.integritySecret,
    ),
    'redirect-url': params.redirectUrl,
    'customer-data:email': params.email,
  });
  return `${CHECKOUT_URL}?${query}`;
}

export interface SignedEvent {
  data: Record<string, unknown>;
  signature: { properties: string[]; checksum: string };
  timestamp: number;
}

function valueAt(data: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) => (value !== null && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined),
      data,
    );
}

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

/**
 * SHA-256 of the values named in `signature.properties` (paths inside `data`), the timestamp and the events secret.
 * The list comes with each event and Wompi may change it, so it is never hardcoded.
 */
export async function isValidEvent(event: SignedEvent, secret: string): Promise<boolean> {
  const values = event.signature.properties.map((path) => valueAt(event.data, path));
  if (!values.every((value) => ['string', 'number', 'boolean'].includes(typeof value))) return false;
  const expected = await sha256(`${values.join('')}${event.timestamp}${secret}`);
  // Constant time: the comparison does not reveal how much of a forged checksum was right.
  return sameText(expected, event.signature.checksum.toLowerCase());
}
