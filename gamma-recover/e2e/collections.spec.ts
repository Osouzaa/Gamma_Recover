import { expect, test } from './fixtures';
test('modal mantém o contrato selecionado, permite cancelar e atualiza o histórico ao salvar', async ({
  page,
}) => {
  await page.goto('/carteiras');
  await page
    .getByRole('row')
    .filter({ hasText: 'Crédito pessoal' })
    .getByRole('button', { name: 'CSV', exact: true })
    .click();
  await page.getByLabel('Arquivo CSV').setInputFiles({
    name: 'contatos.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'documento;nome;contrato;valor;vencimento\nDEMO-CONTATO;Pessoa Atendimento;CONTATO-PRIMEIRO;300,00;2026-10-01\nDEMO-CONTATO;Pessoa Atendimento;CONTATO-SEGUNDO;500,00;2026-10-02',
    ),
  });
  await page.getByRole('button', { name: 'Confirmar importação de 2 contratos' }).click();
  await expect(page.getByRole('status')).toContainText('Importação concluída');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.goto('/cobranca');
  await page.getByLabel('Buscar na fila').fill('Pessoa Atendimento');
  const second = page.getByRole('row').filter({ hasText: 'CONTATO-SEGUNDO' });
  await second.getByRole('button', { name: 'Selecionar', exact: true }).click();
  await expect(second.getByRole('button', { name: 'Selecionado' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByLabel('Observações do atendimento')).toHaveCount(0);
  await page.getByRole('button', { name: 'Registrar atendimento', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Registrar atendimento', exact: true });
  await expect(modal).toContainText('CONTATO-SEGUNDO');
  await expect(modal).toContainText('Horizonte Financeira');
  await modal.getByLabel('Observações do atendimento').fill('Cancelado sem gravar.');
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  await expect(page.getByText('Cancelado sem gravar.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Registrar atendimento', exact: true }).click();
  await modal.getByRole('button', { name: 'Salvar atendimento' }).click();
  await expect(modal.getByText('Descreva o atendimento (mínimo 5 caracteres).')).toBeVisible();
  await modal
    .getByLabel('Observações do atendimento')
    .fill('Contato confirmado no segundo contrato fictício.');
  await modal.getByRole('button', { name: 'Salvar atendimento' }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Histórico atualizado');
  await expect(
    page.getByText('Contato confirmado no segundo contrato fictício.', { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: 'artifacts/collections-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Registrar atendimento', exact: true }).click();
  await expect(modal).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/contact-modal-mobile.png', fullPage: true });
  await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(modal).toHaveCount(0);
});
