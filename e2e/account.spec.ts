import { expect, test, type Browser, type Page } from '@playwright/test';
import { blockGoogle, readDocument, signInAndConsent, signInWithGoogle, useFakeSpeech } from './helpers';

async function newDevice(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  await useFakeSpeech(context);
  await blockGoogle(context);
  return context.newPage();
}

/** Waits until nothing is pending (the sync runs 2 s after each change). */
async function waitForSync(page: Page, type: string) {
  await expect.poll(async () => ((await readDocument(page, type)) as { pending?: boolean } | undefined)?.pending, {
    timeout: 10_000,
  }).toBe(false);
}

test('login with Google: data authorization, then back to the requested screen', async ({ browser }) => {
  const page = await newDevice(browser);
  await page.goto('/kit');
  await expect(page).toHaveURL(/\/login\?volver=%2Fkit$/);

  await signInWithGoogle(page, { sub: 'e2e-login', name: 'Ana Prueba', email: 'ana@example.com' });
  await page.waitForURL('**/bienvenida');
  const continueButton = page.getByRole('button', { name: 'CONTINUAR' });
  await expect(continueButton).toBeDisabled();
  await page.getByRole('checkbox').check();
  await continueButton.click();

  await expect(page).toHaveURL(/\/kit$/);
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Mi cuenta: Ana Prueba/ })).toBeVisible();
  await expect(page.getByText('✓ Sincronizado')).toBeVisible();
});

test('"Ahora no" on the authorization signs out and leaves emergencies available', async ({ browser }) => {
  const page = await newDevice(browser);
  await page.goto('/login');
  await signInWithGoogle(page, { sub: 'e2e-not-now', name: 'Luis', email: 'luis@example.com' });
  await page.waitForURL('**/bienvenida');
  await page.getByRole('button', { name: 'Ahora no' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Crea tu cuenta para guardar tu plan familiar')).toBeVisible();
});

test('home, lists and family group persist after reloading and sync to a second device', async ({ browser }) => {
  const user = { sub: 'e2e-sync', name: 'Marta', email: 'marta@example.com' };
  const phone = await newDevice(browser);
  await phone.goto('/login');
  await signInAndConsent(phone, user);

  // Home
  await phone.goto('/vivienda');
  await phone.getByText('Apartamento', { exact: true }).click();
  await phone.getByText('Tercer piso o más', { exact: true }).click();
  await phone.getByRole('button', { name: 'GUARDAR CONFIGURACIÓN' }).click();
  await expect(phone).toHaveURL(/\/$/);

  // Kit: tap two items
  await phone.goto('/kit');
  await phone.getByRole('checkbox', { name: '💧 Agua' }).click();
  await phone.getByRole('checkbox', { name: '📻 Radio' }).click();
  await expect(phone.getByText('Listos: 2 de 9')).toBeVisible();

  // Family group: name required, invalid phone, then save
  await phone.goto('/nucleo/persona');
  await expect(phone.getByText('Asegúrate de que las personas que agregas estén de acuerdo en recibir tus avisos.')).toBeVisible();
  await phone.getByRole('button', { name: '💾 GUARDAR PERSONA' }).click();
  await expect(phone.getByRole('alert')).toHaveText('Escribe el nombre de la persona.');
  await phone.getByLabel('Nombre de la persona').fill('Ana Torres');
  await phone.getByLabel('Número telefónico').fill('300 abc');
  await phone.getByRole('button', { name: '💾 GUARDAR PERSONA' }).click();
  await expect(phone.getByRole('alert')).toHaveText('El número solo puede tener dígitos, espacios, guiones y +.');
  await phone.getByLabel('Número telefónico').fill('+57 300 123 4567');
  await phone.getByLabel('Relación con esta persona').fill('Mamá');
  await phone.getByRole('button', { name: '💾 GUARDAR PERSONA' }).click();
  await expect(phone).toHaveURL(/\/nucleo$/);
  await expect(phone.getByText('👤 Ana Torres')).toBeVisible();

  // Edit preloads the three fields (fix 9.2)
  await phone.getByRole('link', { name: '✏️ EDITAR' }).click();
  await expect(phone.getByLabel('Nombre de la persona')).toHaveValue('Ana Torres');
  await expect(phone.getByLabel('Número telefónico')).toHaveValue('+57 300 123 4567');
  await expect(phone.getByLabel('Relación con esta persona')).toHaveValue('Mamá');
  await phone.getByRole('link', { name: '↩️ VOLVER' }).click();

  // Everything survives a reload
  await phone.reload();
  await expect(phone.getByText('👤 Ana Torres')).toBeVisible();
  await phone.goto('/kit');
  await expect(phone.getByText('Listos: 2 de 9')).toBeVisible();
  for (const type of ['home', 'kit', 'contacts']) await waitForSync(phone, type);

  // Second device, same account: gets everything
  const laptop = await newDevice(browser);
  await laptop.goto('/login');
  await signInWithGoogle(laptop, user);
  await expect(laptop).toHaveURL(/\/$/); // already authorized: no /bienvenida
  await laptop.goto('/nucleo');
  await expect(laptop.getByText('👤 Ana Torres')).toBeVisible();
  await laptop.goto('/kit');
  await expect(laptop.getByRole('checkbox', { name: '💧 Agua' })).toHaveAttribute('aria-checked', 'true');
  await laptop.goto('/vivienda');
  await expect(laptop.getByRole('radio', { name: 'Apartamento' })).toBeChecked();

  // Delete on the laptop (fix 9.1): gone on the phone too
  await laptop.goto('/nucleo');
  await laptop.getByRole('button', { name: '🗑️ ELIMINAR' }).click();
  await expect(laptop.getByText('👤 Ana Torres')).toBeHidden();
  await waitForSync(laptop, 'contacts');
  await phone.goto('/nucleo');
  await expect(phone.getByText('👤 Ana Torres')).toBeHidden();

  // The earthquake now uses the saved home (apartment, third floor or higher)
  await phone.goto('/');
  await phone.getByRole('link', { name: 'ESTÁ TEMBLANDO' }).click();
  await expect(phone.getByText('Paso 8 de 8')).toBeVisible({ timeout: 15_000 });
  const spoken = await phone.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
  expect(spoken).toContain('Estás en un piso alto.');
});

test('my account: download data and sign out (local data removed)', async ({ browser }) => {
  const page = await newDevice(browser);
  await page.goto('/login');
  await signInAndConsent(page, { sub: 'e2e-account', name: 'Sofía', email: 'sofia@example.com' });
  await page.goto('/checklist');
  await page.getByRole('checkbox').first().click();
  await waitForSync(page, 'checklist');

  await page.goto('/cuenta');
  await expect(page.getByText('sofia@example.com')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'DESCARGAR MIS DATOS' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('alerta-mis-datos.json');

  await page.getByRole('button', { name: 'CERRAR SESIÓN' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Crea tu cuenta para guardar tu plan familiar')).toBeVisible();
  expect(await readDocument(page, 'checklist')).toBeUndefined();
});

test('delete my account asks twice and removes the account', async ({ browser }) => {
  const user = { sub: 'e2e-delete', name: 'Pablo', email: 'pablo@example.com' };
  const page = await newDevice(browser);
  await page.goto('/login');
  await signInAndConsent(page, user);
  await page.goto('/cuenta');
  await page.getByRole('button', { name: 'ELIMINAR MI CUENTA' }).click();
  await page.getByRole('button', { name: 'CONTINUAR' }).click();
  await page.getByRole('button', { name: 'SÍ, ELIMINAR MI CUENTA' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Tu cuenta fue eliminada.')).toBeVisible();

  // Signing in again starts from scratch: the authorization is asked again.
  await page.goto('/login');
  await signInWithGoogle(page, user);
  await page.waitForURL('**/bienvenida');
});
