import { expect, test } from './fixtures';
test('dashboard: leitura financeira, comparações válidas e filtros operacionais', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  const before = await page.evaluate(async () => {
    const url = '/src/services/persistence.ts';
    const { demoAdapter, withDatabase } = await import(url);
    await demoAdapter.reset();
    await withDatabase('readwrite', (db: { installments: { paidAt?: string }[] }) => {
      const paid = db.installments.find((i) => i.paidAt);
      if (paid) {
        const end = new Date();
        end.setDate(0);
        paid.paidAt = end.toISOString().slice(0, 10);
      }
    });
    return demoAdapter.read();
  });
  await expect(
    page.getByRole('heading', { name: 'Carteira administrada', exact: true }).locator('../..'),
  ).toContainText('R$ 160.605,96');
  await page.getByRole('button', { name: 'Sobre Carteira administrada', exact: true }).focus();
  await expect(page.getByRole('tooltip')).toContainText('snapshots');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.getByLabel('Período dos indicadores').selectOption('1');
  await expect(page.getByRole('checkbox', { name: 'Comparar período anterior' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Comparar período anterior' }).uncheck();
  await page.getByLabel('Período dos indicadores').selectOption('all');
  await expect(page.getByRole('checkbox', { name: 'Comparar período anterior' })).toHaveCount(0);
  await page.getByLabel('Empresa credora').selectOption('cr-2');
  await expect(
    page.getByRole('heading', { name: 'Carteira administrada', exact: true }).locator('../..'),
  ).toContainText('R$ 57.321,00');
  await page.getByLabel('Empresa credora').selectOption('');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar indicadores' }).click();
  expect((await download).suggestedFilename()).toBe('indicadores.csv');
  await page.getByRole('link', { name: 'Pendências de conciliação' }).click();
  await expect(page.getByLabel('Situação financeira')).toHaveValue('Divergência');
  const after = await page.evaluate(async () => {
    const url = '/src/services/persistence.ts';
    return (await import(url)).demoAdapter.read();
  });
  expect(after).toEqual(before);
  expect(errors).toEqual([]);
});
test('navegação: recolhimento, menu do usuário, tooltip e menu móvel', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Recolher navegação' }).click();
  await expect(page.getByRole('complementary', { name: 'Navegação principal' })).toHaveCSS(
    'width',
    '68px',
  );
  await page.getByRole('link', { name: 'Carteiras', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Carteiras', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Expandir navegação' }).click();
  await page.getByRole('button', { name: 'Menu do usuário' }).click();
  await expect(page.getByRole('link', { name: 'Perfil e configurações' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: 'Perfil e configurações' })).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir navegação' }).click();
  await expect(page.getByRole('button', { name: 'Fechar menu' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Abrir navegação' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('detalhes, timeline e abas mantêm acesso por teclado', async ({ page }) => {
  await page.goto('/carteiras');
  const detail = page.getByRole('button', { name: 'Detalhes', exact: true }).first();
  await detail.click();
  await expect(page.getByRole('dialog')).toContainText('contratos vinculados');
  await page.screenshot({ path: 'artifacts/portfolio-detail.png', fullPage: true });
  await page.keyboard.press('Escape');
  await expect(detail).toBeFocused();
  await page.goto('/devedores/dv-10');
  await expect(page.getByRole('list', { name: 'Histórico de atendimentos' })).toContainText(
    'Retorno agendado',
  );
  await page.screenshot({ path: 'artifacts/debtor-timeline.png', fullPage: true });
  await page.goto('/configuracoes');
  await page.getByRole('tab', { name: 'Credores e políticas' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Usuários e permissões' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('tabpanel')).toContainText('Sessão demonstrativa');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/devedores');
  await expect(page.getByRole('heading', { name: 'Devedores', exact: true })).toBeVisible();
});

test('layouts compactos não geram overflow em larguras intermediárias', async ({ page }) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/negociacoes', '/configuracoes', '/empresas']) {
      await page.goto(path);
      await expect(page.locator('main h1')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${width}px ${path}`,
      ).toBe(true);
    }
  }
});
