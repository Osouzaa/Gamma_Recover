import { expect, test } from './fixtures';

test('negociação avança por contrato, condições e aceite sem misturar o histórico', async ({
  page,
}) => {
  await page.goto('/negociacoes');
  const steps = page.getByRole('list', { name: 'Etapas da negociação' });
  const current = steps.locator('[aria-current="step"]');
  await expect(current).toContainText('Escolher contrato');
  await expect(page.getByLabel('Desconto (%)')).toBeHidden();
  await page.getByLabel('Dívida para negociação').selectOption('dt-10');
  await page.getByRole('button', { name: 'Continuar negociação', exact: true }).click();
  await expect(current).toContainText('Montar proposta');
  await page.getByLabel('Desconto (%)').fill('10');
  await page.getByLabel('Entrada (R$)').fill('100');
  await page.getByLabel('Parcelas após a entrada').fill('3');
  await page.getByRole('tab', { name: 'Histórico de propostas', exact: true }).click();
  await expect(page.getByLabel('Desconto (%)')).toBeHidden();
  await page.getByRole('tab', { name: 'Nova negociação', exact: true }).click();
  await expect(page.getByLabel('Entrada (R$)')).toHaveValue('100');
  await page.getByRole('button', { name: 'Trocar contrato', exact: true }).click();
  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.dismiss()),
    page.getByLabel('Dívida para negociação').selectOption('dt-11'),
  ]);
  await expect(page.getByLabel('Dívida para negociação')).toHaveValue('dt-10');
  await page.getByRole('button', { name: 'Continuar negociação', exact: true }).click();
  await expect(page.getByLabel('Entrada (R$)')).toHaveValue('100');
  await page.getByRole('button', { name: 'Revisar proposta', exact: true }).click();
  await expect(current).toContainText('Confirmar acordo');
  await expect(page.getByLabel('Desconto (%)')).toBeHidden();
  const confirm = page.getByRole('button', { name: 'Confirmar acordo demonstrativo', exact: true });
  await expect(confirm).toBeDisabled();
  await page.getByLabel('Confirmo o aceite').check();
  await page.getByRole('button', { name: 'Alterar condições', exact: true }).click();
  await expect(current).toContainText('Montar proposta');
  await expect(page.getByLabel('Entrada (R$)')).toHaveValue('100');
  await page.getByLabel('Desconto (%)').fill('12');
  await page.getByRole('button', { name: 'Revisar proposta', exact: true }).click();
  await expect(page.getByLabel('Confirmo o aceite')).not.toBeChecked();
  await page.screenshot({ path: 'artifacts/negotiation-confirmation-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/negotiation-confirmation-mobile.png', fullPage: true });
  await page.getByRole('tab', { name: 'Histórico de propostas', exact: true }).click();
  await page.getByRole('button', { name: 'Retomar proposta', exact: true }).first().click();
  await expect(current).toContainText('Confirmar acordo');
  await expect(page.getByLabel('Confirmo o aceite')).not.toBeChecked();
  await page.getByLabel('Confirmo o aceite').check();
  await confirm.click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('contrato indisponível no link não negocia outro contrato silenciosamente', async ({
  page,
}) => {
  await page.goto('/negociacoes?divida=inexistente');
  await expect(page.getByText(/O contrato não está disponível/)).toBeVisible();
  await expect(page.getByLabel('Desconto (%)')).toHaveCount(0);
  await page.getByRole('button', { name: 'Escolher outro contrato', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Continuar negociação', exact: true }),
  ).toBeEnabled();
});
