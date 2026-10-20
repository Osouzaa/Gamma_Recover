import { expect, test } from './fixtures';

test('assistente orienta, navega e preserva a conversa sem executar operações', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Abrir assistente Gamma' }).click();
  const assistant = page.getByRole('dialog', { name: 'Assistente Gamma' });
  await expect(assistant).toContainText('sem IA generativa');
  await expect(assistant.getByLabel('Sua dúvida sobre o sistema')).toBeFocused();
  await assistant.getByRole('button', { name: 'Como registrar um atendimento?' }).click();
  const log = assistant.getByRole('log');
  await expect(log).toContainText('Financeiro não registra atendimentos');
  await page.screenshot({ path: 'artifacts/assistant-desktop.png' });
  await log.getByRole('link', { name: 'Abrir tela relacionada' }).click();
  await expect(page).toHaveURL(/\/cobranca$/);
  await expect(assistant).not.toBeVisible();
  await page.getByRole('button', { name: 'Abrir assistente Gamma' }).click();
  await assistant.getByLabel('Sua dúvida sobre o sistema').fill('Qual será o tempo amanhã?');
  await assistant.getByRole('button', { name: 'Enviar pergunta' }).click();
  await expect(log).toContainText('Não encontrei uma orientação segura');
  await assistant.getByRole('button', { name: 'Limpar conversa' }).click();
  await expect(log.locator('li')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Abrir assistente Gamma' })).toBeFocused();
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole('button', { name: 'Abrir assistente Gamma' }).click();
  await expect(assistant).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({ path: 'artifacts/assistant-mobile.png' });
});
