import { beforeEach, expect, it } from 'vitest';
import {
  contactDestination,
  contactHref,
  debtorContactsSchema,
  phoneDigits,
} from '../services/contactChannels';
import { DebtorContactService } from '../services/debtorContacts';
import { CollectionService, DebtorService } from '../services/operations';
import { demoAdapter } from '../services/persistence';
import { ImportService, parseCSV } from '../services/import';
const scope = { creditorId: 'cr-1', role: 'Administrador' as const };
const values = {
  phone: '(11) 90000-0000',
  whatsapp: '(21) 90000-0000',
  email: 'contato@contribuinte.demo',
  preferredChannel: 'WhatsApp' as const,
};
beforeEach(async () => {
  localStorage.clear();
  await demoAdapter.reset();
});
it('normalizes Brazilian numbers, keeps WhatsApp explicit and rejects unsafe or fictitious targets', async () => {
  const debtor = (await demoAdapter.read()).debtors[9];
  expect(phoneDigits('+55 (11) 90000-0000')).toBe('5511900000000');
  expect(phoneDigits('(11) 3000-0000')).toBe('551130000000');
  expect(phoneDigits('(00) 00000-0000')).toBe('');
  expect(phoneDigits('javascript:11900000000')).toBe('');
  expect(contactDestination(debtor, 'E-mail')).toBe('');
  expect(contactHref({ ...debtor, phone: values.phone }, 'WhatsApp')).toBeUndefined();
  expect(contactHref({ ...debtor, ...values }, 'WhatsApp')).toBe('https://wa.me/5521900000000');
  expect(contactHref({ ...debtor, ...values }, 'Telefone')).toBe('tel:+5511900000000');
  expect(contactHref({ ...debtor, ...values }, 'E-mail')).toBe('mailto:contato@contribuinte.demo');
  expect(debtorContactsSchema.safeParse({ ...values, whatsapp: '' }).success).toBe(false);
  expect(
    debtorContactsSchema.safeParse({ ...values, email: 'x@x.demo\r\nBcc:other@x.demo' }).success,
  ).toBe(false);
});
it('saves channels transactionally without changing financial data and rejects unauthorized edits', async () => {
  const before = await demoAdapter.read();
  await DebtorContactService.save(scope, 'dt-10', values);
  const db = await demoAdapter.read();
  expect(db.debtors[9]).toMatchObject(values);
  expect(db.debts).toEqual(before.debts);
  expect(db.agreements).toEqual(before.agreements);
  expect(db.installments).toEqual(before.installments);
  expect(db.audit[0].action).toBe('Canais do contribuinte atualizados');
  await expect(
    DebtorContactService.save({ ...scope, role: 'Financeiro' }, 'dt-10', values),
  ).rejects.toThrow('perfil');
  await expect(
    DebtorContactService.save({ ...scope, creditorId: 'cr-2' }, 'dt-10', values),
  ).rejects.toThrow('contexto');
  expect(await demoAdapter.read()).toEqual(db);
});
it('records the used channel and destination snapshot, preserving it after edits', async () => {
  await DebtorContactService.save(scope, 'dt-10', values);
  await CollectionService.record(scope, {
    debtorId: 'dv-10',
    debtId: 'dt-10',
    channel: 'WhatsApp',
    result: 'Sem contato',
    note: 'Tentativa fictícia sem resposta.',
    nextDate: '',
    promiseAmount: 0,
  });
  const snapshot = (await demoAdapter.read()).contacts[0];
  expect(snapshot).toMatchObject({
    channel: 'WhatsApp',
    destination: '5521900000000',
    result: 'Sem contato',
  });
  await DebtorContactService.save(scope, 'dt-10', { ...values, whatsapp: '(31) 90000-0000' });
  expect((await demoAdapter.read()).contacts[0]).toEqual(snapshot);
  await DebtorService.block(scope, 'dt-10');
  await expect(
    CollectionService.record(scope, {
      debtorId: 'dv-10',
      debtId: 'dt-10',
      channel: 'WhatsApp',
      result: 'Contato realizado',
      note: 'Não deve registrar bloqueado.',
      nextDate: '',
      promiseAmount: 0,
    }),
  ).rejects.toThrow('bloqueado');
});
it('rejects an unavailable channel and preserves legacy attendance without inventing a destination', async () => {
  const before = await demoAdapter.read();
  const attendance = {
    debtorId: 'dv-10',
    debtId: 'dt-10',
    result: 'Sem contato' as const,
    note: 'Registro demonstrativo interno.',
    nextDate: '',
    promiseAmount: 0,
  };
  await expect(
    CollectionService.record(scope, { ...attendance, channel: 'WhatsApp' }),
  ).rejects.toThrow('Canal indisponível');
  expect(await demoAdapter.read()).toEqual(before);
  await CollectionService.record(scope, attendance);
  expect((await demoAdapter.read()).contacts[0]).toMatchObject({ channel: 'Registro interno' });
  expect((await demoAdapter.read()).contacts[0].destination).toBeUndefined();
});
it('imports optional channels while retaining the old CSV format and rejecting conflicting updates atomically', async () => {
  const base = 'documento;nome;contrato;valor;vencimento';
  const old = base + '\nDEMO-CANAL;Pessoa Canal;CANAL-01;200,00;2026-10-01';
  expect(parseCSV(old).errors).toEqual([]);
  await ImportService.commit(scope, 'pt-1', old, 'antigo.csv');
  let db = await demoAdapter.read();
  expect(db.debtors.find((d) => d.document === 'DEMO-CANAL')).toMatchObject({
    phone: '',
    email: '',
  });
  const csv =
    base +
    ';telefone;whatsapp;email\nDEMO-CANAL;Pessoa Canal;CANAL-02;300,00;2026-10-02;(11) 90000-0000;(21) 90000-0000;contato@contribuinte.demo';
  expect(parseCSV(csv).errors).toEqual([]);
  await ImportService.commit(scope, 'pt-1', csv, 'canais.csv');
  db = await demoAdapter.read();
  expect(db.debtors.find((d) => d.document === 'DEMO-CANAL')).toMatchObject({
    phone: values.phone,
    whatsapp: values.whatsapp,
    email: values.email,
  });
  await expect(
    ImportService.commit(
      scope,
      'pt-1',
      csv.replace('CANAL-02', 'CANAL-03').replace('(11) 90000-0000', '(31) 90000-0000'),
      'divergente.csv',
    ),
  ).rejects.toThrow('divergente');
  expect(await demoAdapter.read()).toEqual(db);
  expect(
    parseCSV(csv.replace('(11) 90000-0000', 'telefone-invalido')).errors.length,
  ).toBeGreaterThan(0);
});
