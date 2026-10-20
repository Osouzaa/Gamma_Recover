import { expect, test } from './fixtures';
import { addDays, addMonths, today } from '../src/utils/format';
test('dashboard concilia vencimentos e cidade, exporta filtros e mantém leitura sem mutações', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/carteiras');
  await page
    .getByRole('row')
    .filter({ hasText: 'Crédito pessoal' })
    .getByRole('button', { name: 'CSV', exact: true })
    .click();
  const cutoff = addMonths(today(), -60);
  await page
    .getByLabel('Arquivo CSV')
    .setInputFiles({
      name: 'kpis.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        [
          'documento;nome;contrato;valor;vencimento;telefone;whatsapp;email;cidade;uf',
          `DEMO-KPI;Pessoa KPI;KPI-5ANOS;100;${cutoff};;;;Cidade KPI;SP`,
          `DEMO-KPI;Pessoa KPI;KPI-RECENTE;200;${addDays(today(), -1)};;;;Cidade KPI;SP`,
          `DEMO-KPI;Pessoa KPI;KPI-HOJE;300;${today()};;;;Cidade KPI;SP`,
          `DEMO-KPI;Pessoa KPI;KPI-FUTURO;400;${addDays(today(), 1)};;;;Cidade KPI;SP`,
        ].join('\n'),
      ),
    });
  await page.getByRole('button', { name: 'Confirmar importação de 4 contratos' }).click();
  await expect(page.getByRole('status')).toContainText('Importação concluída');
  await page.goto('/');
  const read = () =>
    page.evaluate(async () => {
      const url = '/src/services/persistence.ts';
      return (await import(url)).demoAdapter.read();
    });
  const before = await read();
  await page
    .getByLabel('Cidade da análise', { exact: true })
    .selectOption({ label: 'Cidade KPI / SP' });
  const analysis = page.getByRole('region', { name: 'Análise de carteira e território' });
  const metric = (name: string) =>
    analysis.getByRole('heading', { name, exact: true }).locator('../..');
  await expect(metric('Valor em análise').locator('> strong')).toHaveText('R$ 1.000,00');
  await expect(metric('Valor vencido').locator('> strong')).toHaveText('R$ 300,00');
  await expect(metric('Valor a vencer').locator('> strong')).toHaveText('R$ 700,00');
  await expect(metric('Vencidos há menos de 5 anos').locator('> strong')).toHaveText('R$ 200,00');
  await page.getByLabel('Vencimento da análise').selectOption('under5');
  await expect(metric('Valor em análise').locator('> strong')).toHaveText('R$ 200,00');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar análise', exact: true }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe('analise-carteira.csv');
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString('utf8');
  expect(csv).toContain('KPI-RECENTE');
  expect(csv).not.toContain('KPI-5ANOS');
  await page.getByRole('button', { name: 'Limpar filtros da análise' }).click();
  await page.getByLabel('Base da análise').selectOption('installments');
  await expect(
    page.getByRole('img', {
      name: 'Gráfico de valores a vencer por mês; dados exatos disponíveis a seguir',
    }),
  ).toBeVisible();
  await page.getByLabel('Base da análise').selectOption('combined');
  await page.screenshot({ path: 'artifacts/kpi-dashboard-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/kpi-dashboard-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await read()).toEqual(before);
  expect(errors).toEqual([]);
});
test('cidade/UF pode ser atualizada no cadastro e refletida na análise sem inventar dados legados', async ({
  page,
}) => {
  await page.goto('/devedores/dv-10');
  await page.getByRole('button', { name: 'Editar localização', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Editar localização' });
  await dialog.getByLabel('Cidade', { exact: true }).fill('Cidade Demonstração');
  await dialog.getByLabel('UF', { exact: true }).selectOption('MG');
  await dialog.getByRole('button', { name: 'Salvar localização' }).click();
  await expect(dialog).toHaveCount(0);
  await page.goto('/');
  await page
    .getByLabel('Cidade da análise', { exact: true })
    .selectOption({ label: 'Cidade Demonstração / MG' });
  await expect(
    page
      .getByRole('region', { name: 'Análise de carteira e território' })
      .getByText('1 pessoa única'),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByLabel('Cidade da análise')
      .getByRole('option', { name: 'Cidade Demonstração / MG', exact: true }),
  ).toHaveCount(1);
});
