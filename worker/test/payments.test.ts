// @vitest-environment node
import { createHash } from 'node:crypto';
import { decodeJwt } from 'jose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PRICES_IN_CENTS } from '../src/payments';
import { APP_URL, startWorker, WOMPI, type TestWorker } from './helpers';

let w: TestWorker;

beforeAll(async () => {
  w = await startWorker();
}, 60_000);

afterAll(async () => {
  await w?.dispose();
});

/** Logs in and returns an access token and the refresh cookie. */
async function signIn(sub: string) {
  const { body, cookie } = await w.refresh(await w.login(sub));
  return { token: body.accessToken as string, cookie: cookie! };
}

function checkout(token: string, product: unknown = 'standard') {
  return w.fetch('/api/checkout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ product }),
  });
}

async function startPurchase(sub: string) {
  const user = await signIn(sub);
  const { reference } = (await (await checkout(user.token)).json()) as { reference: string };
  return { ...user, reference };
}

interface Transaction {
  id: string;
  reference: string;
  status: string;
  amount_in_cents?: number;
  currency?: string;
}

/** An event as Wompi sends it, signed with the test events secret (computed here, not with the Worker's code). */
function wompiEvent(
  transaction: Transaction,
  options: { secret?: string; environment?: string; event?: string; properties?: string[] } = {},
) {
  const data = {
    transaction: {
      amount_in_cents: PRICES_IN_CENTS.standard,
      currency: 'COP',
      payment_method_type: 'CARD',
      customer_email: 'ana@example.com',
      ...transaction,
    },
  };
  const properties = options.properties ?? ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  const timestamp = 1_761_300_000;
  const values = properties
    .map((path) => path.split('.').reduce<unknown>((value, key) => (value as Record<string, unknown>)[key], data))
    .join('');
  const checksum = createHash('sha256')
    .update(`${values}${timestamp}${options.secret ?? WOMPI.eventsSecret}`)
    .digest('hex')
    .toUpperCase();
  return {
    event: options.event ?? 'transaction.updated',
    data,
    environment: options.environment ?? 'test',
    signature: { properties, checksum },
    timestamp,
    sent_at: '2026-10-24T12:00:00.000Z',
  };
}

function sendEvent(body: unknown) {
  return w.fetch('/api/payments/wompi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function purchase(reference: string) {
  return w.env.DB.prepare(
    'SELECT status, amount, currency, transaction_id, provider_status, payment_method FROM purchases WHERE external_ref = ?',
  )
    .bind(reference)
    .first<Record<string, unknown>>();
}

/** Renews the session (as the app does) and returns the license's `premium` and the rotated cookie. */
async function renew(cookie: string) {
  const { body, cookie: next } = await w.refresh(cookie);
  return { premium: decodeJwt(body.license as string).premium, cookie: next! };
}

describe('POST /api/checkout', () => {
  it('records a pending purchase and returns a signed Web Checkout URL', async () => {
    const { token } = await signIn('checkout-user');
    const response = await checkout(token);
    expect(response.status).toBe(200);
    const { checkoutUrl, reference } = (await response.json()) as { checkoutUrl: string; reference: string };

    const url = new URL(checkoutUrl);
    expect(url.origin + url.pathname).toBe('https://checkout.wompi.co/p/');
    const amount = String(PRICES_IN_CENTS.standard);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      'public-key': WOMPI.publicKey,
      currency: 'COP',
      'amount-in-cents': amount,
      reference,
      'signature:integrity': createHash('sha256')
        .update(`${reference}${amount}COP${WOMPI.integritySecret}`)
        .digest('hex'),
      'redirect-url': `${APP_URL}/premium/resultado`,
      'customer-data:email': 'ana@example.com',
    });
    expect(await purchase(reference)).toMatchObject({
      status: 'pending',
      amount: PRICES_IN_CENTS.standard,
      currency: 'COP',
      transaction_id: null,
    });
  });

  it('the price comes from the server: the client only picks the product', async () => {
    const { token } = await signIn('share-user');
    const { checkoutUrl } = (await (await checkout(token, 'share')).json()) as { checkoutUrl: string };
    expect(new URL(checkoutUrl).searchParams.get('amount-in-cents')).toBe(String(PRICES_IN_CENTS.share));

    expect((await checkout(token, 'free')).status).toBe(400);
    const withAmount = await w.fetch('/api/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: 'standard', amount: 100 }),
    });
    expect(withAmount.status).toBe(400);
  });

  it('without a session: 401; without Wompi keys: 503', async () => {
    expect((await w.fetch('/api/checkout', { method: 'POST', body: '{"product":"standard"}' })).status).toBe(401);
    const { token } = await signIn('unconfigured-user');
    const response = await w.fetch(
      '/api/checkout',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: '{"product":"standard"}' },
      { WOMPI_PUBLIC_KEY: undefined },
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: 'payments_unavailable' });
  });

  it('with Premium already active: 409', async () => {
    const { token, reference } = await startPurchase('already-user');
    await sendEvent(wompiEvent({ id: 'tx-already', reference, status: 'APPROVED' }));
    const response = await checkout(token);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: 'already_premium' });
  });
});

describe('POST /api/payments/wompi', () => {
  it('an approved transaction activates Premium in the next license', async () => {
    const { cookie, reference } = await startPurchase('approved-user');
    const before = await renew(cookie);
    expect(before.premium).toBe(false);

    const response = await sendEvent(wompiEvent({ id: 'tx-approved', reference, status: 'APPROVED' }));
    expect(response.status).toBe(200);
    expect(await purchase(reference)).toMatchObject({
      status: 'paid',
      transaction_id: 'tx-approved',
      provider_status: 'APPROVED',
      payment_method: 'CARD',
    });
    expect((await renew(before.cookie)).premium).toBe(true);
  });

  it('rejects a forged event: wrong secret or changed value', async () => {
    const { reference } = await startPurchase('forged-user');
    const forged = await sendEvent(wompiEvent({ id: 'tx-forged', reference, status: 'APPROVED' }, { secret: 'test_events_other' }));
    expect(forged.status).toBe(401);

    const changed = wompiEvent({ id: 'tx-forged', reference, status: 'DECLINED' });
    changed.data.transaction.status = 'APPROVED';
    expect((await sendEvent(changed)).status).toBe(401);
    expect(await purchase(reference)).toMatchObject({ status: 'pending' });
  });

  it('uses whatever properties Wompi lists in the signature', async () => {
    const { reference } = await startPurchase('properties-user');
    const event = wompiEvent(
      { id: 'tx-properties', reference, status: 'APPROVED' },
      { properties: ['transaction.reference', 'transaction.status', 'transaction.currency'] },
    );
    expect((await sendEvent(event)).status).toBe(200);
    expect(await purchase(reference)).toMatchObject({ status: 'paid' });
  });

  it('repeated and late events do not undo a payment', async () => {
    const { reference } = await startPurchase('repeat-user');
    const approved = wompiEvent({ id: 'tx-repeat', reference, status: 'APPROVED' });
    await sendEvent(approved);
    expect((await sendEvent(approved)).status).toBe(200);
    await sendEvent(wompiEvent({ id: 'tx-repeat', reference, status: 'PENDING' }));
    await sendEvent(wompiEvent({ id: 'tx-other', reference, status: 'DECLINED' }));
    expect(await purchase(reference)).toMatchObject({ status: 'paid', transaction_id: 'tx-repeat' });
  });

  it('a declined attempt can be followed by an approved one', async () => {
    const { reference } = await startPurchase('retry-user');
    await sendEvent(wompiEvent({ id: 'tx-declined', reference, status: 'DECLINED' }));
    expect(await purchase(reference)).toMatchObject({ status: 'failed', provider_status: 'DECLINED' });
    await sendEvent(wompiEvent({ id: 'tx-retry', reference, status: 'APPROVED' }));
    expect(await purchase(reference)).toMatchObject({ status: 'paid', transaction_id: 'tx-retry' });
  });

  it('a voided payment removes Premium from the next license', async () => {
    const { cookie, reference } = await startPurchase('voided-user');
    await sendEvent(wompiEvent({ id: 'tx-voided', reference, status: 'APPROVED' }));
    const paid = await renew(cookie);
    expect(paid.premium).toBe(true);

    // Only the paid transaction can void it.
    await sendEvent(wompiEvent({ id: 'tx-someone-else', reference, status: 'VOIDED' }));
    expect(await purchase(reference)).toMatchObject({ status: 'paid' });

    await sendEvent(wompiEvent({ id: 'tx-voided', reference, status: 'VOIDED' }));
    expect(await purchase(reference)).toMatchObject({ status: 'refunded', provider_status: 'VOIDED' });
    expect((await renew(paid.cookie)).premium).toBe(false);
  });

  it('ignores, with 200, a different amount, an unknown reference, another environment or another event', async () => {
    const { reference } = await startPurchase('ignored-user');
    const cases: [ReturnType<typeof wompiEvent>, string][] = [
      [wompiEvent({ id: 'tx-cheap', reference, status: 'APPROVED', amount_in_cents: 100 }), 'amount_mismatch'],
      [wompiEvent({ id: 'tx-usd', reference, status: 'APPROVED', currency: 'USD' }), 'amount_mismatch'],
      [wompiEvent({ id: 'tx-unknown', reference: 'not-ours', status: 'APPROVED' }), 'unknown_reference'],
      [wompiEvent({ id: 'tx-prod', reference, status: 'APPROVED' }, { environment: 'prod' }), 'environment'],
      [wompiEvent({ id: 'tx-token', reference, status: 'APPROVED' }, { event: 'nequi_token.updated' }), 'event'],
    ];
    for (const [event, ignored] of cases) {
      const response = await sendEvent(event);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ignored });
    }
    expect(await purchase(reference)).toMatchObject({ status: 'pending', transaction_id: null });
  });

  it('without the events secret: 503, so Wompi retries later', async () => {
    const response = await w.fetch(
      '/api/payments/wompi',
      { method: 'POST', body: JSON.stringify(wompiEvent({ id: 'tx-x', reference: 'x', status: 'APPROVED' })) },
      { WOMPI_EVENTS_SECRET: undefined },
    );
    expect(response.status).toBe(503);
  });
});
