import { expect, test } from './fixtures';
test('cadastra canais explícitos, registra o canal usado e impede contato após bloqueio', async ({
  page,
}) => {
  await page.goto('/devedores/dv-10');
  await expect(page.getByRole('button', { name: 'Abrir WhatsApp', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Editar canais', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Editar canais do contribuinte' });
  await modal.getByLabel('Telefone com DDD').fill('(11) 90000-0000');
  await modal.getByLabel('Canal preferencial').selectOption('Telefone');
  await modal.getByRole('button', { name: 'Salvar canais' }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByText('pessoa10@example.invalid', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ligar', exact: true })).toHaveAttribute(
    'href',
    'tel:+5511900000000',
  );
  await expect(page.getByRole('button', { name: 'Abrir WhatsApp', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Editar canais', exact: true }).click();
  await modal.getByLabel('WhatsApp com DDD').fill('(21) 90000-0000');
  await modal.getByLabel('E-mail de contato').fill('contato@contribuinte.demo');
  await modal.getByLabel('Canal preferencial').selectOption('WhatsApp');
  await modal.getByRole('button', { name: 'Salvar canais' }).click();
  await expect(modal).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Abrir WhatsApp', exact: true })).toHaveAttribute(
    'href',
    'https://wa.me/5521900000000',
  );
  await expect(page.getByRole('link', { name: 'Escrever e-mail', exact: true })).toHaveAttribute(
    'href',
    'mailto:contato@contribuinte.demo',
  );
  await expect(page.getByText('WhatsApp · Preferencial', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/contributor-channels-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Registrar atendimento' }).click();
  await page.getByRole('button', { name: 'Registrar atendimento', exact: true }).click();
  const attendance = page.getByRole('region', { name: 'Registrar atendimento', exact: true });
  await expect(attendance.getByLabel('Canal do atendimento')).toHaveValue('WhatsApp');
  await attendance.getByLabel('Canal do atendimento').selectOption('Telefone');
  await attendance.getByLabel('Resultado do contato').selectOption('Sem contato');
  await attendance
    .getByLabel('Observações do atendimento')
    .fill('Tentativa fictícia por telefone, sem resposta.');
  await attendance.getByRole('button', { name: 'Salvar atendimento' }).click();
  await expect(attendance).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Histórico de atendimentos' })).toContainText(
    'Telefone · 5511900000000',
  );
  await page.goto('/devedores/dv-10');
  await expect(
    page.getByRole('heading', { name: 'André Demonstração', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await expect(page.getByRole('link', { name: 'Abrir WhatsApp', exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/contributor-channels-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Bloquear operação', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Liberar operação', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir WhatsApp', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Ligar', exact: true })).toBeDisabled();
  await expect(
    page.locator('a[href^="https://wa.me/"],a[href^="mailto:"],a[href^="tel:"]'),
  ).toHaveCount(0);
});
test('importa canais no CSV e permite consultar por canal sem liberar ações ao Financeiro', async ({
  page,
}) => {
  await page.goto('/carteiras');
  await page
    .getByRole('row')
    .filter({ hasText: 'Crédito pessoal' })
    .getByRole('button', { name: 'CSV', exact: true })
    .click();
  await page.getByLabel('Arquivo CSV').setInputFiles({
    name: 'canais.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'documento;nome;contrato;valor;vencimento;telefone;whatsapp;email\nDEMO-CANAIS-E2E;Contribuinte Exemplo;CANAL-E2E;350,00;2026-10-01;;(21) 90000-0000;contato@contribuinte.demo',
    ),
  });
  await page.getByRole('button', { name: 'Confirmar importação de 1 contratos' }).click();
  await expect(page.getByRole('status')).toContainText('Importação concluída');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.goto('/devedores');
  await page.getByLabel('Filtrar por canal').selectOption('WhatsApp');
  await page.getByLabel('Buscar devedor').fill('Contribuinte Exemplo');
  await expect(page.getByRole('row').filter({ hasText: 'Contribuinte Exemplo' })).toContainText(
    'WhatsApp · E-mail',
  );
  await page.getByRole('link', { name: 'Abrir cadastro' }).click();
  const detailURL = page.url();
  await expect(page.getByRole('link', { name: 'Abrir WhatsApp', exact: true })).toHaveAttribute(
    'href',
    'https://wa.me/5521900000000',
  );
  await expect(page.getByRole('button', { name: 'Ligar', exact: true })).toBeDisabled();
  await page.goto('/configuracoes');
  await page.getByRole('tab', { name: 'Usuários e permissões' }).click();
  await page.getByLabel('Usuário / perfil ativo').selectOption('Financeiro');
  await expect(page.getByRole('status')).toContainText('atualizada');
  await page.goto(detailURL);
  await expect(page.getByRole('button', { name: 'Editar canais', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Abrir WhatsApp', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Escrever e-mail', exact: true })).toBeDisabled();
});
