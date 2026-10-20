import { expect, test } from './fixtures';
test('suspende e retoma somente o contrato selecionado com histórico persistido', async ({
  page,
}) => {
  await page.goto('/devedores/dv-10');
  await page.getByRole('button', { name: 'Suspender cobrança', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Suspender cobrança', exact: true });
  await dialog.getByLabel('Motivo da alteração').fill('Revisão documental solicitada pelo credor.');
  await dialog.getByRole('button', { name: 'Suspender cobrança', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Cobrança suspensa', { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('Revisão documental solicitada pelo credor.', { exact: true }),
  ).toBeVisible();
  await page.goto('/cobranca');
  await page.getByLabel('Buscar na fila').fill('André Demonstração');
  await expect(page.getByText('0 contratos na fila')).toBeVisible();
  await page.goto('/devedores/dv-10');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Retomar cobrança', exact: true }).click();
  const resume = page.getByRole('dialog', { name: 'Retomar cobrança', exact: true });
  await resume.getByLabel('Motivo da alteração').fill('Documentação revisada e cobrança liberada.');
  await resume.getByRole('button', { name: 'Retomar cobrança', exact: true }).click();
  await expect(resume).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Suspender cobrança', exact: true })).toBeVisible();
  await expect(
    page.getByText('Documentação revisada e cobrança liberada.', { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
