import { expect, test } from './fixtures';
test('chat local mantém empresa, contrato e rascunhos sem habilitar envio real', async ({
  page,
}) => {
  await page.goto('/devedores/dv-10');
  await page.getByRole('button', { name: 'Editar canais', exact: true }).click();
  const channels = page.getByRole('dialog', { name: 'Editar canais do contribuinte' });
  await channels.getByLabel('WhatsApp com DDD').fill('(21) 90000-0000');
  await channels.getByRole('button', { name: 'Salvar canais' }).click();
  await expect(channels).toHaveCount(0);
  await page.getByRole('link', { name: 'Abrir chat no sistema', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Conversas', exact: true })).toBeVisible();
  await expect(page.getByText(/Elegibilidade Meta pendente/)).toBeVisible();
  await page.getByRole('button', { name: 'Nova conversa', exact: true }).click();
  const create = page.getByRole('dialog', { name: 'Preparar conversa' });
  await expect(create.getByLabel('Contrato do contribuinte')).toHaveValue('dt-10');
  await create.getByRole('button', { name: 'Preparar conversa', exact: true }).click();
  await expect(create).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Enviar pelo WhatsApp', exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel('Mensagem do chat')
    .fill('Olá, esta é uma mensagem fictícia ainda não enviada.');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  const drafts = page.getByRole('list', { name: 'Histórico unificado de mensagens' });
  await expect(drafts).toContainText('Olá, esta é uma mensagem fictícia ainda não enviada.');
  await expect(drafts).toContainText('Rascunho local');
  await expect(drafts).toContainText('CTR-DEMO-1009');
  await page.reload();
  await expect(drafts).toContainText('Olá, esta é uma mensagem fictícia ainda não enviada.');
  await page.getByRole('button', { name: 'Editar rascunho', exact: true }).click();
  await page
    .getByLabel('Mensagem do chat')
    .fill('Mensagem revisada, mantida somente no navegador.');
  await page.getByRole('button', { name: 'Atualizar rascunho', exact: true }).click();
  await expect(drafts).toContainText('Mensagem revisada, mantida somente no navegador.');
  await page.screenshot({ path: 'artifacts/chat-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await expect(page.getByLabel('Mensagem do chat')).toBeVisible();
  await page.screenshot({ path: 'artifacts/chat-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Excluir rascunho', exact: true }).click();
  await expect(drafts).not.toContainText('Mensagem revisada, mantida somente no navegador.');
  await page.getByRole('button', { name: 'Ver integração', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('serviços proibidos');
  await expect(
    page.getByRole('link', { name: 'Consultar política oficial do WhatsApp Business' }),
  ).toHaveAttribute('href', 'https://whatsappbusiness.com/policy/');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
});
test('chat sem número fica indisponível e o perfil financeiro não prepara conversas', async ({
  page,
}) => {
  await page.goto('/conversas');
  await page.getByRole('button', { name: 'Nova conversa', exact: true }).click();
  const create = page.getByRole('dialog', { name: 'Preparar conversa' });
  await create.getByLabel('Contrato do contribuinte').selectOption('dt-10');
  await expect(
    create.getByRole('button', { name: 'Preparar conversa', exact: true }),
  ).toBeDisabled();
  await expect(create).toContainText('não cadastrado');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.goto('/configuracoes');
  await page.getByRole('tab', { name: 'Usuários e permissões' }).click();
  await page.getByLabel('Usuário / perfil ativo').selectOption('Financeiro');
  await expect(page.getByRole('status')).toContainText('atualizada');
  await page.goto('/conversas');
  await expect(page.getByRole('button', { name: 'Nova conversa', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Preparar conversa', exact: true })).toBeDisabled();
});

test('central multicanal preserva rascunhos e simulações por contribuinte e canal', async ({
  page,
}) => {
  await page.goto('/devedores/dv-10');
  await page.getByRole('button', { name: 'Editar canais', exact: true }).click();
  const channels = page.getByRole('dialog', { name: 'Editar canais do contribuinte' });
  await channels.getByLabel('WhatsApp com DDD').fill('(21) 90000-0000');
  await channels.getByLabel('Telefone com DDD').fill('(11) 90000-0000');
  await channels.getByLabel('E-mail de contato').fill('pessoa@contribuinte.demo');
  await channels.getByRole('button', { name: 'Salvar canais' }).click();
  await expect(channels).toHaveCount(0);
  await page.goto('/conversas?divida=dt-10');
  await page.getByRole('button', { name: 'Nova conversa', exact: true }).click();
  const create = page.getByRole('dialog', { name: 'Preparar conversa' });
  await create.getByLabel('Canal de contato').selectOption('E-mail');
  await create.getByRole('button', { name: 'Preparar conversa', exact: true }).click();
  await expect(create).toHaveCount(0);
  await page.getByLabel('Assunto do e-mail').fill('Atendimento demonstrativo');
  await page.getByLabel('Mensagem do chat').fill('E-mail demonstrativo multicanal.');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  const history = page.getByRole('list', { name: 'Histórico unificado de mensagens' });
  await expect(history).toContainText('E-mail · Rascunho local');
  await page.getByRole('button', { name: 'Simular envio', exact: true }).click();
  await expect(history).toContainText('Envio simulado');
  await page.getByLabel('Canal em atendimento').selectOption('SMS');
  await expect(page.getByLabel('Canal em atendimento')).toHaveValue('SMS');
  await page.getByLabel('Modelo de mensagem').selectOption('retorno');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(history).toContainText('SMS · Rascunho local');
  await page.getByRole('button', { name: 'Simular falha', exact: true }).click();
  await expect(history).toContainText('Falha simulada');
  await expect(history).toContainText('E-mail demonstrativo multicanal.');
  await expect(page.getByRole('button', { name: 'Enviar por SMS', exact: true })).toBeDisabled();
  await page.getByLabel('Canal em atendimento').selectOption('WhatsApp');
  await expect(page.getByLabel('Canal em atendimento')).toHaveValue('WhatsApp');
  await expect(history).toContainText('Falha simulada');
  await page.reload();
  await expect(history).toContainText('E-mail demonstrativo multicanal.');
  await expect(history).toContainText('Falha simulada');
  await page.screenshot({
    path: 'artifacts/conversations-multichannel-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({
    path: 'artifacts/conversations-multichannel-mobile.png',
    fullPage: true,
  });
});
