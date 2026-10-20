import { expect, test } from './fixtures';
test('operação integrada: cadastro, importação, contato, acordo e recebimento', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Carteiras', exact: true }).click();
  await page.getByRole('button', { name: 'Nova carteira' }).click();
  await page.getByLabel('Nome da carteira').fill('Carteira de teste E2E');
  await page.getByLabel('Empresa contratante', { exact: true }).selectOption('cr-1');
  await page.getByRole('button', { name: 'Salvar carteira' }).click();
  await expect(page.getByRole('heading', { name: 'Carteira de teste E2E' })).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: 'Carteira de teste E2E' });
  await row.getByRole('button', { name: 'CSV', exact: true }).click();
  await page.getByLabel('Arquivo CSV').setInputFiles({
    name: 'contratos-demo.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'documento;nome;contrato;valor;vencimento\nDEMO-E2E;Pessoa Teste E2E;CTR-E2E;1250,50;2026-09-01',
    ),
  });
  await page.getByRole('button', { name: 'Confirmar importação de 1 contratos' }).click();
  await expect(page.getByRole('status')).toContainText('Importação concluída');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('link', { name: 'Devedores', exact: true }).click();
  await page.getByLabel('Buscar devedor').fill('Pessoa Teste E2E');
  await page.getByRole('link', { name: 'Abrir cadastro' }).click();
  await page.getByRole('link', { name: 'Registrar atendimento' }).click();
  await page.getByLabel('Buscar na fila').fill('Pessoa Teste E2E');
  await page.getByRole('button', { name: 'Registrar atendimento', exact: true }).click();
  await page
    .getByLabel('Observações do atendimento')
    .fill('Atendimento fictício registrado no teste integrado.');
  await page.getByRole('button', { name: 'Salvar atendimento', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Atendimento registrado');
  await page.getByRole('link', { name: 'Encaminhar para negociação' }).click();
  await page.getByLabel('Desconto (%)').fill('10');
  await page.getByLabel('Parcelas após a entrada').fill('2');
  await page.getByRole('button', { name: 'Revisar proposta' }).click();
  await page.getByLabel('Confirmo o aceite').check();
  await page.getByRole('button', { name: 'Confirmar acordo demonstrativo' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('R$ 1.125,45');
  await expect(page.getByRole('dialog')).toContainText('R$ 562,72');
  await expect(page.getByRole('dialog')).toContainText('R$ 562,73');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('link', { name: 'Financeiro', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Financeiro', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Conciliar', exact: true }).first().click();
  await page.getByLabel('Referência da confirmação fictícia').fill('DEMO-E2E-PAGAMENTO');
  await page.getByRole('button', { name: 'Registrar conciliação' }).click();
  await expect(page.getByRole('status')).toContainText('confirmado diretamente ao credor');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test('todas as telas administrativas e viewport móvel sem overflow global', async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const path of [
    '/',
    '/empresas',
    '/carteiras',
    '/devedores',
    '/conversas',
    '/cobranca',
    '/negociacoes',
    '/acordos',
    '/financeiro',
    '/campanhas',
    '/relatorios',
    '/configuracoes',
  ]) {
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/dashboard-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    '/',
    '/empresas',
    '/carteiras',
    '/devedores',
    '/conversas',
    '/cobranca',
    '/negociacoes',
    '/acordos',
    '/financeiro',
    '/campanhas',
    '/relatorios',
    '/configuracoes',
  ]) {
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      path,
    ).toBe(true);
  }
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/dashboard-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('aprovação excepcional, administração, campanhas e exportação', async ({ page }) => {
  await page.goto('/negociacoes');
  await page.getByLabel('Dívida para negociação').selectOption('dt-10');
  await page.getByLabel('Desconto (%)').fill('25');
  await page.getByRole('button', { name: 'Revisar proposta' }).click();
  await expect(page.getByRole('status')).toContainText('aguardando aprovação');
  await page.getByRole('button', { name: 'Aprovar proposta' }).click();
  await expect(page.getByRole('status')).toContainText('Proposta aprovada');
  await page.getByRole('button', { name: 'Retomar proposta' }).click();
  await page.getByLabel('Confirmo o aceite').check();
  await page.getByRole('button', { name: 'Confirmar acordo demonstrativo' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.goto('/configuracoes');
  await page.getByRole('button', { name: 'Novo credor' }).click();
  await page.getByLabel('Nome do credor').fill('Credor E2E fictício');
  await page.getByLabel('Documento fictício').fill('DEMO-E2E-CREDOR');
  await page.getByRole('button', { name: 'Salvar credor e política' }).click();
  await expect(page.getByRole('heading', { name: 'Credor E2E fictício' })).toBeVisible();
  await page.goto('/campanhas');
  await page.getByRole('button', { name: 'Nova campanha' }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Campanha fictícia E2E');
  await page.getByRole('button', { name: 'Criar campanha' }).click();
  await page.getByRole('button', { name: 'Simular campanha' }).click();
  await expect(page.getByRole('status')).toContainText('Nenhuma mensagem foi enviada');
  await expect(page.getByRole('cell', { name: 'Simulada', exact: true })).toBeVisible();
  await page.goto('/relatorios');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  expect((await download).suggestedFilename()).toContain('.csv');
  await page.goto('/configuracoes');
  await page.getByRole('tab', { name: 'Usuários e permissões' }).click();
  await page.getByLabel('Usuário / perfil ativo').selectOption('Financeiro');
  await expect(page.getByRole('status')).toContainText('atualizada');
  await page.goto('/carteiras');
  await expect(page.getByRole('button', { name: 'Nova carteira' })).toBeDisabled();
  await page.goto('/cobranca');
  await expect(
    page.getByRole('button', { name: 'Registrar atendimento', exact: true }),
  ).toBeDisabled();
});
test('duas abas serializam acordos e sincronizam indicadores', async ({ context, page }) => {
  await page.goto('/negociacoes');
  await expect(page.getByRole('heading', { name: 'Negociações', exact: true })).toBeVisible();
  const second = await context.newPage();
  await second.goto('/negociacoes');
  await expect(second.getByRole('heading', { name: 'Negociações', exact: true })).toBeVisible();
  const attempt = async (tab: typeof page) =>
    tab.evaluate(async () => {
      const url = '/src/services/operations.ts';
      const { NegotiationService } = await import(url);
      try {
        await NegotiationService.confirm(
          { creditorId: 'cr-1', role: 'Administrador' },
          'dt-10',
          10,
          0,
          2,
        );
        return true;
      } catch {
        return false;
      }
    });
  const results = await Promise.all([attempt(page), attempt(second)]);
  expect(results.filter(Boolean)).toHaveLength(1);
  await page.goto('/acordos');
  await page.getByLabel('Buscar acordo').fill('André Demonstração');
  await expect(page.getByRole('button', { name: 'Consultar acordo' })).toHaveCount(1);
  await second.close();
});
