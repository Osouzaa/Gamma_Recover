import { test, expect } from './fixtures';
test('empresa, contrato PDF, carteira e importação permanecem vinculados após recarregar', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Empresas', exact: true }).click();
  await page.getByRole('button', { name: 'Nova empresa', exact: true }).click();
  const form = page.getByRole('dialog');
  await expect(form.getByLabel('Razão social', { exact: true })).toHaveAttribute(
    'placeholder',
    /Horizonte/,
  );
  await expect(form.getByText('Selecionar PDF', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/company-form-desktop.png' });
  await form.getByLabel('Razão social', { exact: true }).fill('Empresa CRM Exemplo');
  await form.getByLabel('CNPJ / documento fictício').fill('DEMO-CNPJ-CRM');
  await form.getByLabel('Contato responsável', { exact: true }).fill('Contato Exemplo');
  await form.getByLabel('Telefone', { exact: true }).fill('(00) 00000-0000');
  await form.getByLabel('E-mail', { exact: true }).fill('crm@example.invalid');
  await form.getByLabel('Responsável interno Gamma').fill('Gestora Exemplo');
  await form.getByLabel('Referência do contrato').fill('SERVICO-DEMO-001');
  await form.getByLabel('Início da vigência').fill('2026-10-01');
  await form.getByLabel('Fim da vigência').fill('2027-10-01');
  await form.getByLabel('Contrato PDF opcional').setInputFiles({
    name: 'contrato-demo.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n% contrato ficticio'),
  });
  await expect(form.getByText('contrato-demo.pdf', { exact: true })).toBeVisible();
  await form.getByRole('button', { name: 'Salvar empresa', exact: true }).click();
  await expect(form).toHaveCount(0);
  await page.reload();
  await page.getByLabel('Buscar empresa').fill('Empresa CRM Exemplo');
  const row = page.getByRole('row').filter({ hasText: 'Empresa CRM Exemplo' });
  await row.getByRole('button', { name: 'Detalhes', exact: true }).click();
  await expect(
    page.getByRole('dialog').getByText('SERVICO-DEMO-001', { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar contrato: contrato-demo.pdf' }).click();
  expect((await download).suggestedFilename()).toBe('contrato-demo.pdf');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await row.getByRole('button', { name: 'Carteiras', exact: true }).click();
  await page.getByRole('button', { name: 'Nova carteira', exact: true }).click();
  await page.getByLabel('Nome da carteira', { exact: true }).fill('Carteira CRM Exemplo');
  await expect(page.getByLabel('Empresa contratante', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Salvar carteira', exact: true }).click();
  const portfolio = page.getByRole('row').filter({ hasText: 'Carteira CRM Exemplo' });
  await portfolio.getByRole('button', { name: 'CSV', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Empresa CRM Exemplo');
  await expect(page.getByRole('dialog')).toContainText('Carteira CRM Exemplo');
  await page.getByLabel('Arquivo CSV').setInputFiles({
    name: 'crm.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'documento;nome;contrato;valor;vencimento\nDEMO-CRM-999;Pessoa CRM Ficticia;CRM-REF-999;350,00;2026-10-01',
    ),
  });
  await page.getByRole('button', { name: 'Confirmar importação de 1 contratos' }).click();
  await expect(page.getByRole('status')).toContainText('Importação concluída');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('link', { name: 'Empresas', exact: true }).click();
  await row.getByRole('button', { name: 'Detalhes', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('crm.csv');
  await expect(page.getByRole('dialog')).toContainText('Carteira CRM Exemplo');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.screenshot({ path: 'artifacts/companies-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await row.getByRole('button', { name: 'Editar empresa', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('Substituir PDF', { exact: true })).toBeVisible();
  await page
    .getByRole('dialog')
    .getByText('Substituir PDF', { exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/company-form-mobile.png' });
  await page.getByRole('button', { name: 'Remover anexo', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar empresa', exact: true }).click();
  await page.reload();
  await row.getByRole('button', { name: 'Detalhes', exact: true }).click();
  await expect(page.getByText('Sem contrato anexado.', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/company-mobile.png', fullPage: true });
});
