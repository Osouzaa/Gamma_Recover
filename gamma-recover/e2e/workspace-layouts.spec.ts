import { expect, test } from './fixtures';
test('tarefas por contrato, abas de indicadores e conclusão auditada', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('tab', { name: 'Carteira e território', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Recuperação e operação', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Evolução dos recebimentos' })).toBeVisible();
  await page.goto('/tarefas');
  await page.getByRole('button', { name: 'Nova tarefa', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Nova tarefa' });
  await page.setViewportSize({ width: 320, height: 844 });
  await expect
    .poll(() => form.evaluate((element) => element.scrollWidth <= element.clientWidth))
    .toBe(true);
  await form.getByLabel('Contrato da tarefa').selectOption('dt-10');
  await form.getByLabel('Próxima ação').fill('Revisar documentação do contrato');
  await form.getByRole('button', { name: 'Criar tarefa' }).click();
  await expect(form).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload();
  await page.getByRole('tab', { name: 'Hoje', exact: true }).click();
  await expect(
    page.getByRole('row').filter({ hasText: 'Revisar documentação do contrato' }),
  ).toContainText('André Demonstração');
  await page.getByRole('button', { name: 'Concluir tarefa' }).click();
  await page.getByRole('tab', { name: 'Concluídas', exact: true }).click();
  await expect(
    page.getByRole('row').filter({ hasText: 'Revisar documentação do contrato' }),
  ).toContainText('Concluída');
  await page.screenshot({ path: 'artifacts/tasks-layout-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({ path: 'artifacts/tasks-layout-mobile.png', fullPage: true });
});
test('régua editável com linha do tempo, simulação persistida e pausa', async ({ page }) => {
  await page.goto('/reguas');
  await page.getByRole('button', { name: 'Nova régua', exact: true }).click();
  let form = page.getByRole('dialog', { name: 'Nova régua' });
  await form.getByLabel('Nome da régua').fill('Recuperação assistida');
  await form.getByLabel('Dias da etapa 1').fill('365');
  await form.getByRole('button', { name: 'Adicionar etapa' }).click();
  await form.getByLabel('Dias da etapa 2').fill('7');
  await form.getByLabel('Canal da etapa 2').selectOption('E-mail');
  await page.setViewportSize({ width: 320, height: 844 });
  await expect
    .poll(() => form.evaluate((element) => element.scrollWidth <= element.clientWidth))
    .toBe(true);
  await form.getByRole('button', { name: 'Salvar régua' }).click();
  await expect(form).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'Simular régua', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Zero envios');
  await expect(
    page.getByRole('combobox', { name: 'Simulação registrada' }).getByRole('option'),
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'Simular régua', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Simulação registrada' }).getByRole('option'),
  ).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('list', { name: 'Etapas de Recuperação assistida' })).toContainText(
    '365 dias depois',
  );
  await page.screenshot({ path: 'artifacts/journeys-layout-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Editar régua' }).click();
  form = page.getByRole('dialog', { name: 'Editar régua' });
  await form.getByRole('checkbox', { name: 'Régua ativa para simulação' }).uncheck();
  await form.getByRole('button', { name: 'Salvar régua' }).click();
  await expect(form).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Simular régua', exact: true })).toBeDisabled();
  await page.setViewportSize({ width: 320, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({ path: 'artifacts/journeys-layout-mobile.png', fullPage: true });
});
