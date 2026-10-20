import { expect, test } from '@playwright/test';
import { signIn } from './fixtures';

test('login and logout work without crypto.randomUUID', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined, configurable: true });
  });
  await signIn(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Entrar no Gamma Recover' })).toBeVisible();
});
test('login obrigatório, erro, retorno à rota e saída sem reentrada pelo histórico', async ({
  page,
}) => {
  await page.goto('/acordos?acordo=ac-1');
  await expect(page.getByRole('heading', { name: 'Entrar no Gamma Recover' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Carteiras', exact: true })).toHaveCount(0);
  await page.getByLabel('E-mail', { exact: true }).fill('admin@gamma.demo');
  await page.getByLabel('Senha', { exact: true }).fill('incorreta');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('inválidos');
  await page.getByLabel('Senha', { exact: true }).fill('Gamma@123');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Acordos', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Carteiras', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Carteiras', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Entrar no Gamma Recover' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Entrar no Gamma Recover' })).toBeVisible();
  await page.goto('/financeiro');
  await expect(page.getByRole('heading', { name: 'Entrar no Gamma Recover' })).toBeVisible();
});
test('saída alcança outras abas', async ({ page, context }) => {
  await signIn(page);
  const second = await context.newPage();
  await second.goto('/devedores');
  await expect(second.getByRole('heading', { name: 'Devedores', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(second.getByRole('heading', { name: 'Entrar no Gamma Recover' })).toBeVisible();
  await second.close();
});
test('entrada financeira respeita o perfil e login funciona em mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill('financeiro@gamma.demo');
  await page.getByLabel('Senha', { exact: true }).fill('Gamma@123');
  await page.screenshot({ path: 'artifacts/login-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.goto('/carteiras');
  await expect(page.getByRole('button', { name: 'Nova carteira' })).toBeDisabled();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'artifacts/login-desktop.png', fullPage: true });
});

test('portal não está disponível por links nem por endereços antigos', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('link', { name: /Portal do devedor/i })).toHaveCount(0);
  await signIn(page);
  await expect(page.locator('a[href^="/portal"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Menu do usuário' }).click();
  await expect(page.getByRole('link', { name: /Portal do devedor/i })).toHaveCount(0);
  for (const path of [
    '/portal',
    '/portal/dividas',
    '/portal/dividas/dt-10',
    '/portal/acordos',
    '/portal/ajuda',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar acesso demonstrativo' })).toHaveCount(0);
  }
});

test('login destaca o formulário e preenche o perfil somente após escolha explícita', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Usar perfil Operador' })).toBeHidden();
  await page.screenshot({ path: 'artifacts/login-redesign-desktop.png', fullPage: true });
  const demo = page.getByText('Experimentar com um perfil de demonstração', { exact: true });
  await demo.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Usar perfil Operador' }).click();
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue('operador@gamma.demo');
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('Gamma@123');
  await expect(page).toHaveURL(/\/login$/);
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/login-redesign-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.goto('/carteiras');
  await expect(page.getByRole('button', { name: 'Nova carteira', exact: true })).toBeDisabled();
});

test('logo e favicon carregam no login e a marca permanece na sidebar recolhida', async ({
  page,
}) => {
  await page.goto('/login');
  await expect(page.getByRole('img', { name: 'Gamma Recover', exact: true })).toBeVisible();
  for (const url of [
    '/favicon.svg',
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/brand/wordmark-light.svg',
    '/brand/gamma-symbol.svg',
  ]) {
    const response = await page.request.get(url);
    expect(response.ok(), url).toBe(true);
  }
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    'href',
    '/favicon.svg',
  );
  expect(
    await page
      .locator('main img')
      .evaluateAll((images) =>
        images.every(
          (image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        ),
      ),
  ).toBe(true);
  await signIn(page);
  const sidebar = page.getByRole('complementary', { name: 'Navegação principal' });
  await expect(sidebar.getByRole('img', { name: 'Gamma Recover', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recolher navegação' }).click();
  await expect(sidebar.locator('img[data-brand-copy]')).toBeHidden();
  await expect(sidebar.locator('img').first()).toBeVisible();
  await page.screenshot({ path: 'artifacts/brand/sidebar-compact.png', fullPage: true });
});
