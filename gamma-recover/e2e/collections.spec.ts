import { expect, test } from './fixtures';

test('fila lateral permite escolher, ordenar e localizar um caso', async ({ page }) => {
  await page.goto('/cobranca');
  await expect(page.getByRole('table')).toHaveCount(0);
  const queue = page.getByRole('list', { name: 'Contratos para atendimento' });
  await expect(queue).toBeVisible();
  await page.getByLabel('Ordenar fila').selectOption('nome');
  const names = await queue.locator('strong').allTextContents();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'pt-BR')));
  const chosen = queue.getByRole('button').nth(1);
  const selectedName = await chosen.locator('strong').innerText();
  await chosen.click();
  await expect(chosen).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('region', { name: 'Ficha de atendimento' })).toContainText(
    selectedName,
  );
  await page.reload();
  await expect(page.getByLabel('Ordenar fila')).toHaveValue('nome');
  await expect(page.getByRole('region', { name: 'Ficha de atendimento' })).toContainText(
    selectedName,
  );
  await expect(page.getByRole('tab', { name: 'Contato', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.screenshot({ path: 'artifacts/collection-queue-desktop.png', fullPage: true });
  await page.getByLabel('Buscar na fila').fill('sem-resultado-ficticio');
  await expect(page.getByText('0 contratos na fila')).toBeVisible();
  await expect(queue).toHaveCount(0);
  await page.getByLabel('Buscar na fila').fill('');
  await expect(queue).toBeVisible();
});

test('ficha integra contrato, atendimento, tarefa e historico', async ({ page }) => {
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
  const second = page.getByRole('button', {
    name: /Atender Pessoa Atendimento, contrato CONTATO-SEGUNDO/,
  });
  await second.click();
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Observações do atendimento')).toHaveCount(0);
  await page.getByRole('button', { name: 'Registrar atendimento', exact: true }).click();
  const modal = page.getByRole('region', { name: 'Registrar atendimento', exact: true });
  await expect(modal).toContainText('CONTATO-SEGUNDO');
  await expect(page.getByRole('region', { name: 'Ficha de atendimento' })).toContainText(
    'Horizonte Financeira',
  );
  await modal.getByLabel('Observações do atendimento').fill('Cancelado sem gravar.');
  page.once('dialog', (dialog) => dialog.accept());
  await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
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
  await page.getByRole('button', { name: 'Registrar atendimento', exact: true }).click();
  await modal.getByLabel('Observações do atendimento').fill('Rascunho que deve ser preservado.');
  await page.getByRole('tab', { name: 'Histórico', exact: true }).click();
  await expect(modal).toBeHidden();
  await page.getByRole('tab', { name: 'Contato', exact: true }).click();
  await expect(modal.getByLabel('Observações do atendimento')).toHaveValue(
    'Rascunho que deve ser preservado.',
  );
  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.dismiss()),
    page.getByRole('link', { name: 'Encaminhar para negociação' }).click(),
  ]);
  await expect(modal.getByLabel('Observações do atendimento')).toHaveValue(
    'Rascunho que deve ser preservado.',
  );
  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.dismiss()),
    page.getByLabel('Empresa credora', { exact: true }).selectOption('cr-2'),
  ]);
  await expect(page.getByLabel('Empresa credora', { exact: true })).toHaveValue('');
  await expect(modal.getByLabel('Observações do atendimento')).toHaveValue(
    'Rascunho que deve ser preservado.',
  );
  page.once('dialog', (dialog) => dialog.accept());
  await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar atendimento', exact: true }).click();
  await modal.getByLabel('Resultado do contato').selectOption('Promessa de pagamento');
  await modal.getByLabel('Valor prometido (R$)').fill('120');
  await modal
    .getByLabel('Observações do atendimento')
    .fill('Promessa fictícia para o segundo contrato.');
  await modal.getByRole('button', { name: 'Salvar atendimento' }).click();
  await page.getByRole('tab', { name: 'Tarefas', exact: true }).click();
  const tasks = page.getByRole('region', { name: 'Próximas ações do contrato' });
  await expect(tasks).toContainText('Promessa de pagamento');
  await page.reload();
  await page.getByRole('tab', { name: 'Tarefas', exact: true }).click();
  await expect(page.getByLabel('Buscar na fila')).toHaveValue('Pessoa Atendimento');
  await expect(page.getByRole('region', { name: 'Ficha de atendimento' })).toContainText(
    'CONTATO-SEGUNDO',
  );
  await expect(tasks).toContainText('Promessa de pagamento');
  await tasks.getByRole('button', { name: 'Concluir tarefa:' }).click();
  await expect(tasks).toContainText('Nenhuma ação pendente');
  await page
    .getByRole('button', { name: /Atender Pessoa Atendimento, contrato CONTATO-PRIMEIRO/ })
    .click();
  await page.getByRole('tab', { name: 'Histórico', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Histórico do contrato' })).not.toContainText(
    'Contato confirmado no segundo contrato',
  );
  await second.click();
  await page.getByRole('tab', { name: 'Tarefas', exact: true }).click();
  await tasks.getByRole('button', { name: 'Nova tarefa', exact: true }).click();
  const taskForm = page.getByRole('dialog', { name: 'Nova tarefa', exact: true });
  await expect(taskForm.getByLabel('Contrato da tarefa')).toBeDisabled();
  await expect(taskForm.getByLabel('Contrato da tarefa').locator('option:checked')).toContainText(
    'CONTATO-SEGUNDO',
  );
  await taskForm
    .getByLabel('Próxima ação', { exact: true })
    .fill('Confirmar documentação do contrato');
  await taskForm.getByRole('button', { name: 'Criar tarefa', exact: true }).click();
  await expect(taskForm).toHaveCount(0);
  await expect(tasks).toContainText('Confirmar documentação do contrato');
  await page.getByRole('tab', { name: 'Contato', exact: true }).click();
  await page.screenshot({ path: 'artifacts/collections-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Registrar atendimento', exact: true }).click();
  await expect(modal).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/contact-workspace-mobile.png', fullPage: true });
  await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(modal).toHaveCount(0);
});
