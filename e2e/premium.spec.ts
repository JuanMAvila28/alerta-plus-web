import { expect, test } from '@playwright/test';
import { blockGoogle, grantPremium, signInAndConsent, useFakeSpeech } from './helpers';

test.beforeEach(async ({ context }) => {
  await useFakeSpeech(context);
  await blockGoogle(context);
});

test('without Premium the library is closed and buying is not available yet', async ({ page }) => {
  await page.goto('/login');
  await signInAndConsent(page, { sub: 'e2e-free', name: 'Free', email: 'free@example.com' });
  await page.goto('/premium/guias');
  await expect(page).toHaveURL(/\/premium$/);
  await expect(page.getByRole('button', { name: 'ADQUIRIR PREMIUM' })).toBeDisabled();
  await expect(page.getByText('La compra de Premium estará disponible próximamente.')).toBeVisible();

  await page.getByRole('button', { name: 'RESTAURAR COMPRA' }).click();
  await expect(page.getByText('No encontramos una compra de Premium en tu cuenta.')).toBeVisible();
});

test('a paid purchase activates Premium with RESTAURAR, and it keeps working offline', async ({ page, context }) => {
  await page.goto('/login');
  await signInAndConsent(page, { sub: 'e2e-premium', name: 'Prem', email: 'prem@example.com' });
  await page.goto('/premium');
  await expect(page.getByRole('button', { name: 'ADQUIRIR PREMIUM' })).toBeDisabled();

  // No gateway yet (D2): the purchase is recorded by hand, as the webhook would.
  grantPremium('e2e-premium');
  await page.getByRole('button', { name: 'RESTAURAR COMPRA' }).click();
  await expect(page.getByText('Premium está activo en tu cuenta.')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'PREMIUM ACTIVO' })).toBeVisible();

  // Library → guide
  await page.getByRole('link', { name: 'TU BIBLIOTECA PREMIUM' }).click();
  await expect(page.locator('nav a')).toHaveCount(13);
  await page.getByRole('link', { name: 'Quemaduras' }).click();
  await expect(page.getByText('Paso 1 de 3')).toBeVisible();
  await expect(page.getByRole('button', { name: 'ANTERIOR' })).toBeDisabled();
  await page.getByRole('button', { name: 'SIGUIENTE' }).click();
  await expect(page.getByText('AGUA CORRIENTE FRESCA', { exact: true })).toBeVisible();
  await expect(page.locator('figure img')).toHaveAttribute('src', '/illustrations/water.svg');
  // Polled: the new step's image is still loading right after SIGUIENTE.
  await expect
    .poll(() => page.locator('figure img').evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);

  // Practice: answer everything right except the first question
  await page.goto('/premium/practica');
  await page.getByRole('button', { name: 'Corro sin mirar' }).click();
  await expect(page.getByText('✗ Incorrecto')).toBeVisible();
  await page.getByRole('button', { name: 'CONTINUAR' }).click();
  for (const answer of [
    'No; primero debe ser seguro cortar la corriente',
    'No',
    'No; sigue orientación profesional',
    'La ubicación y qué ocurrió',
  ]) {
    await page.getByRole('button', { name: answer, exact: true }).click();
    await expect(page.getByText('✓ Correcto')).toBeVisible();
    await page.getByRole('button', { name: 'CONTINUAR' }).click();
  }
  await expect(page.getByText('Respuestas correctas: 4 de 5')).toBeVisible();

  // Offline: the signed license on the device is enough.
  await context.setOffline(true);
  await page.reload();
  await page.goto('/premium/guias/0');
  await expect(page.getByRole('heading', { name: 'Heridas y sangrado' })).toBeVisible();
  await context.setOffline(false);
});
