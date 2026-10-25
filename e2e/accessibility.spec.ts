import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { blockGoogle, grantPremium, signInWithGoogle, useFakeSpeech } from './helpers';

/** WCAG 2.1 AA (includes AA contrast) on the current screen. */
async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    page.url(),
  ).toEqual([]);
}

/** Every tap target in the screen is at least 48 × 48 px (plan phase 7). */
async function expectTouchTargets(page: Page) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('main a, main button, main label:has(input), main input:not([type=radio]):not([type=checkbox])')]
      .filter((element) => element.offsetParent !== null)
      .map((element) => {
        const box = element.getBoundingClientRect();
        return { text: (element.textContent || element.getAttribute('aria-label') || element.tagName).trim().slice(0, 40), w: box.width, h: box.height };
      })
      .filter(({ w, h }) => w < 48 || h < 48),
  );
  expect(small, page.url()).toEqual([]);
}

async function check(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await expectNoAxeViolations(page);
  await expectTouchTargets(page);
}

test.beforeEach(async ({ context }) => {
  await useFakeSpeech(context);
  await blockGoogle(context);
});

test('screens without an account', async ({ page }) => {
  for (const path of ['/', '/idioma', '/login', '/sismo', '/emergencia', '/emergencia/herida']) {
    await check(page, path);
  }
});

test('screens with an account and Premium', async ({ page }) => {
  await page.goto('/login');
  await signInWithConsentAndCheck(page);
  grantPremium('e2e-a11y');
  // Opening the app renews the session, which already brings the Premium license.
  await page.goto('/premium');
  await expect(page.getByRole('status').filter({ hasText: 'PREMIUM ACTIVO' })).toBeVisible();

  for (const path of [
    '/',
    '/cuenta',
    '/vivienda',
    '/kit',
    '/nucleo',
    '/nucleo/persona',
    '/premium',
    '/premium/guias',
    '/premium/guias/0',
    '/premium/practica',
  ]) {
    await check(page, path);
  }
});

async function signInWithConsentAndCheck(page: Page) {
  await signInWithGoogle(page, { sub: 'e2e-a11y', name: 'Accesible', email: 'a11y@example.com' });
  await page.waitForURL('**/bienvenida');
  await expectNoAxeViolations(page);
  await expectTouchTargets(page);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'CONTINUAR' }).click();
  await expect(page).not.toHaveURL(/bienvenida/);
}
