import { beforeEach, expect, it } from 'vitest';
import { demoAdapter, withDatabase } from '../services/persistence';
import { DebtSuspensionService } from '../services/debtSuspension';
import { isSuspended, metrics } from '../services/domain';
import {
  CampaignService,
  CollectionService,
  NegotiationService,
  PaymentService,
} from '../services/operations';
import { ConversationService } from '../services/conversations';
const scope = { creditorId: 'cr-1', role: 'Administrador' as const };
beforeEach(async () => {
  localStorage.clear();
  await demoAdapter.reset();
});
it('preserves legacy data and isolates a suspension from other debts and creditors', async () => {
  const before = await demoAdapter.read();
  expect(before.debts.every((d) => !isSuspended(d))).toBe(true);
  await DebtSuspensionService.set(scope, 'dt-10', true, 'Revisão documental solicitada.');
  const db = await demoAdapter.read();
  expect(db.debts.filter(isSuspended).map((d) => d.id)).toEqual(['dt-10']);
  expect(db.debts.filter((d) => d.id !== 'dt-10')).toEqual(
    before.debts.filter((d) => d.id !== 'dt-10'),
  );
  expect(db.debtors).toEqual(before.debtors);
  expect(db.agreements).toEqual(before.agreements);
  expect(db.installments).toEqual(before.installments);
  expect(metrics(db).eligible).toBe(metrics(before).eligible - before.debts[9].amount);
  expect(db.debts[9].suspensionHistory?.[0]).toMatchObject({
    suspended: true,
    actor: db.settings.operatorName,
  });
  expect(db.audit[0].action).toBe('Cobrança do contrato suspensa');
});
it('revalidates pending proposals, contacts, conversations and campaign eligibility', async () => {
  const proposal = await NegotiationService.propose(scope, 'dt-10', 0, 0, 1);
  await DebtSuspensionService.set(scope, 'dt-10', true, 'Aguardando revisão do contrato.');
  const before = await demoAdapter.read();
  await expect(NegotiationService.confirm(scope, 'dt-10', 0, 0, 1, proposal.id)).rejects.toThrow(
    'bloqueada',
  );
  await expect(
    CollectionService.record(scope, {
      debtorId: 'dv-10',
      debtId: 'dt-10',
      result: 'Sem contato',
      note: 'Tentativa suspensa.',
      nextDate: '',
      promiseAmount: 0,
    }),
  ).rejects.toThrow('suspensa');
  await expect(ConversationService.open(scope, 'dt-10')).rejects.toThrow('suspensa');
  expect(await demoAdapter.read()).toEqual(before);
  await CampaignService.create(scope, {
    name: 'Campanha de teste',
    creditorId: 'cr-1',
    minDays: 0,
  });
  expect((await demoAdapter.read()).campaigns.at(-1)?.audience).not.toContain('dt-10');
  await DebtSuspensionService.set(scope, 'dt-10', false, 'Revisão finalizada pelo credor.');
  await NegotiationService.confirm(scope, 'dt-10', 0, 0, 1, proposal.id);
  expect((await demoAdapter.read()).debts[9].suspensionHistory).toHaveLength(2);
});
it('rejects wrong scope, role, invalid reasons and concurrent duplicate changes atomically', async () => {
  const before = await demoAdapter.read();
  await expect(
    DebtSuspensionService.set({ ...scope, creditorId: 'cr-2' }, 'dt-10', true, 'Motivo válido.'),
  ).rejects.toThrow('contexto');
  await expect(
    DebtSuspensionService.set({ ...scope, role: 'Financeiro' }, 'dt-10', true, 'Motivo válido.'),
  ).rejects.toThrow('perfil');
  await expect(DebtSuspensionService.set(scope, 'dt-10', true, ' ')).rejects.toThrow();
  expect(await demoAdapter.read()).toEqual(before);
  const results = await Promise.allSettled(
    [1, 2].map(() => DebtSuspensionService.set(scope, 'dt-10', true, 'Revisão solicitada.')),
  );
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect((await demoAdapter.read()).debts[9].suspensionHistory).toHaveLength(1);
});
it('allows reconciliation of existing agreements while suspended and keeps other restrictions on resume', async () => {
  await DebtSuspensionService.set(scope, 'dt-1', true, 'Revisão de contatos solicitada.');
  const db = await demoAdapter.read();
  const agreement = db.agreements.find((a) => a.debtId === 'dt-1')!;
  const item = db.installments.find((i) => i.agreementId === agreement.id && !i.paidAt)!;
  await PaymentService.reconcile(scope, item.id, item.amount, 'DEMO-SUSPENSAO');
  expect(
    (await demoAdapter.read()).installments.find((i) => i.id === item.id)?.paidAt,
  ).toBeTruthy();
  await DebtSuspensionService.set(scope, 'dt-10', true, 'Revisão de cobrança solicitada.');
  await withDatabase('readwrite', (state) => {
    state.debts[9].disputed = true;
  });
  await DebtSuspensionService.set(scope, 'dt-10', false, 'Retomada autorizada com restrições.');
  await expect(NegotiationService.propose(scope, 'dt-10', 0, 0, 1)).rejects.toThrow('bloqueada');
});

it('keeps another creditor of the same person eligible and rechecks existing campaign audiences', async () => {
  await withDatabase('readwrite', (db) => {
    db.debts.push({
      ...db.debts[9],
      id: 'dt-same-person',
      reference: 'DEMO-OTHER-CREDITOR',
      portfolioId: 'pt-3',
    });
  });
  await CampaignService.create(scope, {
    name: 'Campanha anterior',
    creditorId: 'cr-1',
    minDays: 0,
  });
  const campaign = (await demoAdapter.read()).campaigns.at(-1)!;
  expect(campaign.audience).toContain('dt-10');
  await DebtSuspensionService.set(scope, 'dt-10', true, 'Revisão solicitada.');
  const other = { ...scope, creditorId: 'cr-2' };
  await NegotiationService.propose(other, 'dt-same-person', 0, 0, 1);
  await CampaignService.run(scope, campaign.id);
  expect((await demoAdapter.read()).campaigns.at(-1)?.audience).not.toContain('dt-10');
});
