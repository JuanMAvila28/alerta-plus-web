// Premium purchase with Wompi Web Checkout.
import type { Env } from './env';
import { HttpError, json, readJson } from './http';
import { checkoutBody, wompiEvent, wompiTransaction, type WompiTransaction } from './schemas';
import { checkoutUrl, isValidEvent, keyEnvironment } from './wompi';

/** COP cents, decided here and never by the client. Example values until the price is set (D3). */
export const PRICES_IN_CENTS = { standard: 1_490_000, share: 1_190_000 } as const;
const CURRENCY = 'COP';

type PurchaseStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Each Wompi status: the purchase status it leads to and the statuses it may replace.
// A paid purchase is never downgraded by a late decline, and a refund needs a paid purchase.
const TRANSITIONS: Record<string, { to: PurchaseStatus; from: PurchaseStatus[] }> = {
  PENDING: { to: 'pending', from: ['pending'] },
  APPROVED: { to: 'paid', from: ['pending', 'failed'] },
  DECLINED: { to: 'failed', from: ['pending', 'failed'] },
  ERROR: { to: 'failed', from: ['pending', 'failed'] },
  VOIDED: { to: 'refunded', from: ['paid'] },
};

/** POST /api/checkout: records a pending purchase and returns the Wompi Web Checkout URL. */
export async function createCheckout(request: Request, env: Env, userId: string): Promise<Response> {
  const publicKey = env.WOMPI_PUBLIC_KEY;
  const integritySecret = env.WOMPI_INTEGRITY_SECRET;
  if (!publicKey || !keyEnvironment(publicKey) || !integritySecret) {
    throw new HttpError(503, 'payments_unavailable', 'Payments are not configured.');
  }
  const body = checkoutBody.safeParse(await readJson(request));
  if (!body.success) throw new HttpError(400, 'invalid_body', body.error.message);
  if (env.CHECKOUT_LIMITER && !(await env.CHECKOUT_LIMITER.limit({ key: userId })).success) {
    throw new HttpError(429, 'rate_limited', 'Too many requests. Try again in a minute.');
  }

  const user = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first<{ email: string }>();
  if (!user) throw new HttpError(404, 'not_found', 'Account not found.');
  const paid = await env.DB.prepare("SELECT 1 FROM purchases WHERE user_id = ? AND status = 'paid' LIMIT 1")
    .bind(userId)
    .first();
  if (paid) throw new HttpError(409, 'already_premium', 'Premium is already active on this account.');

  const { product } = body.data;
  const amountInCents = PRICES_IN_CENTS[product];
  const reference = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO purchases (id, user_id, provider, external_ref, product, amount, currency, status, created_at, updated_at)
     VALUES (?, ?, 'wompi', ?, ?, ?, ?, 'pending', ?, ?)`,
  )
    .bind(crypto.randomUUID(), userId, reference, product, amountInCents, CURRENCY, now, now)
    .run();

  const url = await checkoutUrl({
    publicKey,
    integritySecret,
    reference,
    amountInCents,
    currency: CURRENCY,
    redirectUrl: `${env.APP_URL}/premium/resultado`,
    email: user.email,
  });
  return json({ checkoutUrl: url, reference });
}

/**
 * POST /api/payments/wompi: Wompi's events. Only a valid checksum can change a purchase.
 * Anything that is not an error answers 200: any other status makes Wompi retry for 24 hours.
 */
export async function wompiEvents(request: Request, env: Env): Promise<Response> {
  const environment = keyEnvironment(env.WOMPI_PUBLIC_KEY);
  const secret = env.WOMPI_EVENTS_SECRET;
  if (!environment || !secret) throw new HttpError(503, 'payments_unavailable', 'Payments are not configured.');

  const event = wompiEvent.safeParse(await readJson(request));
  if (!event.success) throw new HttpError(400, 'invalid_body', event.error.message);
  if (!(await isValidEvent(event.data, secret))) throw new HttpError(401, 'invalid_checksum', 'Invalid checksum.');
  if (event.data.environment !== environment) return json({ ignored: 'environment' });
  if (event.data.event !== 'transaction.updated') return json({ ignored: 'event' });

  const transaction = wompiTransaction.safeParse(event.data.data.transaction);
  if (!transaction.success) throw new HttpError(400, 'invalid_body', transaction.error.message);
  const purchase = await env.DB.prepare(
    "SELECT id, amount, currency FROM purchases WHERE provider = 'wompi' AND external_ref = ?",
  )
    .bind(transaction.data.reference)
    .first<{ id: string; amount: number; currency: string }>();
  if (!purchase) return json({ ignored: 'unknown_reference' });
  if (purchase.amount !== transaction.data.amount_in_cents || purchase.currency !== transaction.data.currency) {
    console.error('Wompi amount mismatch', transaction.data.reference, transaction.data.id);
    return json({ ignored: 'amount_mismatch' });
  }

  await applyTransaction(env, purchase.id, transaction.data);
  return json({ received: true });
}

async function applyTransaction(env: Env, purchaseId: string, transaction: WompiTransaction) {
  const transition = Object.hasOwn(TRANSITIONS, transaction.status) ? TRANSITIONS[transaction.status] : undefined;
  if (!transition) return;
  // Repeated or out-of-order events change nothing: the WHERE only lets allowed transitions through,
  // and once paid only the same transaction can touch the purchase.
  await env.DB.prepare(
    `UPDATE purchases SET status = ?, transaction_id = ?, provider_status = ?, payment_method = ?, updated_at = ?
     WHERE id = ? AND status IN (${transition.from.map(() => '?').join(', ')})
       AND (status <> 'paid' OR transaction_id = ?)`,
  )
    .bind(
      transition.to,
      transaction.id,
      transaction.status,
      transaction.payment_method_type ?? null,
      Date.now(),
      purchaseId,
      ...transition.from,
      transaction.id,
    )
    .run();
}
