import { beforeEach, expect, it } from 'vitest';
import { demoAdapter } from '../services/persistence';
import { DebtorLocationService } from '../services/debtorLocation';
import { locationKey, locationSchema } from '../services/location';
import { ImportService, parseCSV } from '../services/import';
const scope = { creditorId: 'cr-1', role: 'Administrador' as const };
const header = 'documento;nome;contrato;valor;vencimento;telefone;whatsapp;email;cidade;uf';
beforeEach(async () => {
  localStorage.clear();
  await demoAdapter.reset();
});
it('valida cidade/UF e grava com auditoria sem alterar obrigações financeiras', async () => {
  const before = await demoAdapter.read();
  await DebtorLocationService.save(scope, 'dt-10', { city: '  São Paulo  ', state: 'SP' });
  const db = await demoAdapter.read();
  expect(db.debtors[9].location).toEqual({ city: 'São Paulo', state: 'SP' });
  expect(db.debts).toEqual(before.debts);
  expect(db.agreements).toEqual(before.agreements);
  expect(db.installments).toEqual(before.installments);
  expect(db.audit[0].action).toBe('Localização do devedor atualizada');
  expect(locationKey({ city: 'Sao Paulo', state: 'SP' })).toBe(locationKey(db.debtors[9].location));
  expect(locationSchema.safeParse({ city: 'Campinas', state: 'XX' }).success).toBe(false);
  await expect(
    DebtorLocationService.save({ ...scope, creditorId: 'cr-2' }, 'dt-10', {
      city: 'Campinas',
      state: 'SP',
    }),
  ).rejects.toThrow('contexto');
  await expect(
    DebtorLocationService.save({ ...scope, role: 'Financeiro' }, 'dt-10'),
  ).rejects.toThrow('perfil');
  expect(await demoAdapter.read()).toEqual(db);
  await DebtorLocationService.save(scope, 'dt-10');
  expect((await demoAdapter.read()).debtors[9].location).toBeUndefined();
});
it('importa localização no formato ampliado, aceita formatos antigos e recusa dados incompletos', async () => {
  const text = `${header}\nDEMO-GEO;Pessoa Geográfica;GEO-01;100,50;2026-12-20;;;;Campinas;sp`;
  expect(parseCSV(text).errors).toEqual([]);
  await ImportService.commit(scope, 'pt-1', text, 'geo.csv');
  expect(
    (await demoAdapter.read()).debtors.find((d) => d.document === 'DEMO-GEO')?.location,
  ).toEqual({ city: 'Campinas', state: 'SP' });
  expect(
    parseCSV(`${header}\nDEMO-GEO2;Pessoa Geográfica;GEO-02;100;2026-12-20;;;;Campinas;`).errors
      .length,
  ).toBeGreaterThan(0);
  expect(
    parseCSV(`${header}\nDEMO-GEO2;Pessoa Geográfica;GEO-02;100;2026-12-20;;;;;`).errors,
  ).toEqual([]);
  expect(
    parseCSV(
      'documento;nome;contrato;valor;vencimento\nDEMO-OLD;Pessoa Antiga;OLD-01;100;2026-10-20',
    ).errors,
  ).toEqual([]);
});
it('reverte todo o lote se houver localização conflitante, preservando o cadastro existente', async () => {
  const before = await demoAdapter.read();
  const text = `${header}\nDEMO-NEW;Pessoa Nova;NEW-01;100;2026-12-20;;;;Curitiba;PR\nDEMO-0010;André Demonstração;CONFLITO-GEO;100;2026-12-20;;;;Salvador;BA`;
  await expect(ImportService.commit(scope, 'pt-1', text, 'conflito.csv')).rejects.toThrow(
    'Localização divergente',
  );
  expect(await demoAdapter.read()).toEqual(before);
});
