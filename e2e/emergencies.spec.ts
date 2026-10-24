import { expect, test } from '@playwright/test';
import { blockGoogle, useFakeSpeech } from './helpers';

test.beforeEach(async ({ context }) => {
  await useFakeSpeech(context);
  await blockGoogle(context);
});

test('earthquake without an account: reads the 8 steps by itself with the default home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'ESTÁ TEMBLANDO' }).click();
  await expect(page).toHaveURL(/\/sismo$/);

  // The fake voice ends each sentence in ~20 ms: the screen must move on by itself up to step 8.
  await expect(page.getByText('Paso 8 de 8')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'PUNTO DE ENCUENTRO' })).toBeVisible();
  // Default home: no meeting point.
  await expect(page.getByText('Dirígete a un lugar seguro previamente acordado con tu familia.')).toBeVisible();

  const spoken = await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
  expect(spoken[0]).toBe('MANTÉN LA CALMA.');
  // Default home (house, first floor): "you are on a high floor" is never read.
  expect(spoken).not.toContain('Estás en un piso alto.');

  await page.getByRole('link', { name: 'VOLVER', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('opened from a shortcut (no tap yet): asks for ▶ COMENZAR, then reads', async ({ page }) => {
  await page.goto('/sismo');
  await expect(page.getByText('La aplicación continuará cuando termine la lectura.')).toBeHidden();
  await page.getByRole('button', { name: '▶ COMENZAR' }).click();
  await expect(page.getByText('Paso 8 de 8')).toBeVisible({ timeout: 15_000 });
});

test('a protocol from the emergency menu reads to the end and goes back to emergencies', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'TENGO UNA EMERGENCIA' }).click();
  await expect(page.getByRole('link', { name: /^🩹 HERIDA/ })).toBeVisible();
  await expect(page.locator('nav a')).toHaveCount(13);

  await page.getByRole('link', { name: /QUEMADURA/ }).click();
  await expect(page).toHaveURL(/\/emergencia\/quemadura$/);
  await expect(page.getByText('Paso 6 de 6')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('link', { name: '↩️ VOLVER A EMERGENCIAS' }).click();
  await expect(page).toHaveURL(/\/emergencia$/);
});

test('without speech: SIGUIENTE PASO advances by hand (fix 9.6)', async ({ page, context }) => {
  await context.addInitScript(() => {
    Reflect.deleteProperty(window, 'speechSynthesis');
    Reflect.deleteProperty(window, 'SpeechSynthesisUtterance');
  });
  await page.goto('/emergencia/desmayo');
  for (let step = 1; step < 6; step++) {
    await expect(page.getByText(`Paso ${step} de 6`)).toBeVisible();
    await page.getByRole('button', { name: 'SIGUIENTE PASO ▶' }).click();
  }
  await expect(page.getByText('Paso 6 de 6')).toBeVisible();
  await expect(page.getByRole('button', { name: 'SIGUIENTE PASO ▶' })).toBeHidden();
});

test('screens that need an account send to /login, which keeps the emergency buttons', async ({ page }) => {
  await page.goto('/kit');
  await expect(page).toHaveURL(/\/login\?volver=%2Fkit$/);
  await expect(page.getByRole('link', { name: 'ESTÁ TEMBLANDO' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'TENGO UNA EMERGENCIA' })).toBeVisible();
});
