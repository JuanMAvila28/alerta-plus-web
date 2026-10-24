import { expect, test } from '@playwright/test';
import { blockGoogle, readDocument, signInAndConsent, useFakeSpeech } from './helpers';

test.beforeEach(async ({ context }) => {
  await useFakeSpeech(context);
  await blockGoogle(context);
});

/** The service worker precaches the app on the first visit. */
async function waitForServiceWorker(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active?.state !== 'activated') {
      await new Promise((resolve) => registration.active?.addEventListener('statechange', resolve));
    }
  });
}

test('without connection: earthquake and protocols open and read (no account)', async ({ page, context }) => {
  await page.goto('/');
  await waitForServiceWorker(page);
  await context.setOffline(true);

  await page.goto('/sismo');
  await page.getByRole('button', { name: '▶ COMENZAR' }).click();
  await expect(page.getByText('Paso 8 de 8')).toBeVisible({ timeout: 15_000 });

  await page.goto('/emergencia/ahogamiento');
  await page.getByRole('button', { name: '▶ COMENZAR' }).click();
  await expect(page.getByText('Paso 6 de 6')).toBeVisible({ timeout: 15_000 });

  // Illustrations are cached too.
  const status = await page.evaluate(async () => (await fetch('/illustrations/wound.svg')).status);
  expect(status).toBe(200);
  await context.setOffline(false);
});

test('signed in and offline: editing works, stays pending and syncs when back online', async ({ page, context }) => {
  await page.goto('/login');
  await signInAndConsent(page, { sub: 'e2e-offline', name: 'Off', email: 'off@example.com' });
  await waitForServiceWorker(page);

  await context.setOffline(true);
  await page.goto('/botiquin');
  await page.getByRole('checkbox').nth(2).click();
  await expect(page.getByText('Listos: 1 de 9')).toBeVisible();
  await page.goto('/');
  await expect(page.getByText('Sin conexión. Tus datos están guardados en este teléfono')).toBeVisible();
  await expect
    .poll(async () => ((await readDocument(page, 'firstAidKit')) as { pending: boolean }).pending)
    .toBe(true);

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect
    .poll(async () => ((await readDocument(page, 'firstAidKit')) as { pending: boolean }).pending, { timeout: 10_000 })
    .toBe(false);
  await expect(page.getByText('✓ Sincronizado')).toBeVisible();
});
