import { beforeEach, expect, it } from 'vitest';
import { ConversationService } from '../services/conversations';
import { DebtorContactService } from '../services/debtorContacts';
import { demoAdapter, withDatabase } from '../services/persistence';
import { adminReturnPath } from '../services/adminSession';
const scope = { creditorId: 'cr-1', role: 'Administrador' as const };
const channels = {
  phone: '',
  email: '',
  whatsapp: '(21) 90000-0000',
  preferredChannel: 'WhatsApp' as const,
};
beforeEach(async () => {
  localStorage.clear();
  await demoAdapter.reset();
  await DebtorContactService.save(scope, 'dt-10', channels);
});
it('opens one conversation per person/company/number, serialized across tabs', async () => {
  const ids = await Promise.all([
    ConversationService.open(scope, 'dt-10'),
    ConversationService.open(scope, 'dt-10'),
  ]);
  expect(ids[0]).toBe(ids[1]);
  expect((await demoAdapter.read()).conversations).toHaveLength(1);
  await withDatabase('readwrite', (db) => {
    db.debts.push({
      ...db.debts[9],
      id: 'dt-other-company',
      portfolioId: 'pt-3',
      reference: 'OTHER-COMPANY',
    });
  });
  const otherId = await ConversationService.open(
    { ...scope, creditorId: 'cr-2' },
    'dt-other-company',
  );
  expect(otherId).not.toBe(ids[0]);
  expect((await demoAdapter.read()).conversations).toHaveLength(2);
});
it('persists and edits only local drafts without changing financial data or attendance', async () => {
  const before = await demoAdapter.read();
  const id = await ConversationService.open(scope, 'dt-10');
  await ConversationService.saveDraft(scope, id, 'dt-10', '  Mensagem fictícia a revisar.  ');
  let db = await demoAdapter.read();
  const draft = db.conversations![0].drafts[0];
  expect(draft.text).toBe('Mensagem fictícia a revisar.');
  expect(draft.actor).toBe(db.settings.operatorName);
  expect(draft).not.toHaveProperty('sentAt');
  expect(draft).not.toHaveProperty('providerMessageId');
  expect(db.contacts).toEqual(before.contacts);
  expect(db.debts).toEqual(before.debts);
  expect(db.agreements).toEqual(before.agreements);
  expect(db.installments).toEqual(before.installments);
  await ConversationService.saveDraft(scope, id, 'dt-10', 'Texto revisado.', draft.id);
  db = await demoAdapter.read();
  expect(db.conversations![0].drafts).toHaveLength(1);
  expect(db.conversations![0].drafts[0].text).toBe('Texto revisado.');
  await ConversationService.removeDraft(scope, id, draft.id);
  expect((await demoAdapter.read()).conversations![0].drafts).toHaveLength(0);
});
it('rejects foreign context, role forgery and drafts for another person without partial writes', async () => {
  await DebtorContactService.save(scope, 'dt-11', channels);
  const id = await ConversationService.open(scope, 'dt-10');
  const before = await demoAdapter.read();
  await expect(
    ConversationService.saveDraft({ ...scope, creditorId: 'cr-2' }, id, 'dt-10', 'Sem permissão.'),
  ).rejects.toThrow('contexto');
  await expect(
    ConversationService.saveDraft({ ...scope, role: 'Financeiro' }, id, 'dt-10', 'Sem permissão.'),
  ).rejects.toThrow('perfil');
  await expect(ConversationService.saveDraft(scope, id, 'dt-11', 'Outra pessoa.')).rejects.toThrow(
    'fora',
  );
  await expect(ConversationService.saveDraft(scope, id, 'dt-10', ' ')).rejects.toThrow();
  await expect(
    ConversationService.saveDraft(scope, id, 'dt-10', 'x'.repeat(4097)),
  ).rejects.toThrow();
  expect(await demoAdapter.read()).toEqual(before);
});
it('revalidates a changed WhatsApp and keeps the old conversation for consultation', async () => {
  const oldId = await ConversationService.open(scope, 'dt-10');
  await ConversationService.saveDraft(scope, oldId, 'dt-10', 'Rascunho no número anterior.');
  await DebtorContactService.save(scope, 'dt-10', { ...channels, whatsapp: '(31) 90000-0000' });
  const before = await demoAdapter.read();
  await expect(
    ConversationService.saveDraft(scope, oldId, 'dt-10', 'Destino alterado.'),
  ).rejects.toThrow('alterado');
  expect(await demoAdapter.read()).toEqual(before);
  const newId = await ConversationService.open(scope, 'dt-10');
  expect(newId).not.toBe(oldId);
  expect((await demoAdapter.read()).conversations).toHaveLength(2);
});
it('rejects blocks and disputes on each draft mutation', async () => {
  const id = await ConversationService.open(scope, 'dt-10');
  await withDatabase('readwrite', (db) => {
    db.debtors[9].blocked = true;
  });
  let before = await demoAdapter.read();
  await expect(ConversationService.saveDraft(scope, id, 'dt-10', 'Bloqueado.')).rejects.toThrow(
    'bloqueado',
  );
  expect(await demoAdapter.read()).toEqual(before);
  await withDatabase('readwrite', (db) => {
    db.debtors[9].blocked = false;
    db.debts[9].disputed = true;
  });
  before = await demoAdapter.read();
  await expect(ConversationService.saveDraft(scope, id, 'dt-10', 'Contestada.')).rejects.toThrow(
    'contestada',
  );
  expect(await demoAdapter.read()).toEqual(before);
});
it('accepts legacy databases and rejects orphan conversation references atomically', async () => {
  const legacy = await demoAdapter.read();
  expect(legacy.conversations).toBeUndefined();
  const id = await ConversationService.open(scope, 'dt-10');
  await ConversationService.saveDraft(scope, id, 'dt-10', 'Rascunho de teste.');
  const before = await demoAdapter.read();
  await expect(
    withDatabase('readwrite', (db) => {
      db.conversations![0].drafts[0].debtId = 'dt-11';
    }),
  ).rejects.toThrow('fora');
  expect(await demoAdapter.read()).toEqual(before);
  expect(adminReturnPath('/conversas?divida=dt-10')).toBe('/conversas?divida=dt-10');
});
