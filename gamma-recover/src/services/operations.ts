import { appendTask } from './tasks';
import { z } from 'zod';
import { attendanceChannelSchema, contactDestination } from './contactChannels';
import type { Database } from '../types/domain';
import { activeAgreement, contactBlocked, createAgreement, prepareProposal } from './domain';
import { requireDebt, requireRole, transact, type Scope } from './store';
import { id, today } from '../utils/format';
const name = z.string().trim().min(3, 'Informe pelo menos 3 caracteres.').max(100);
export const portfolioSchema = z.object({
  name,
  creditorId: z.string().min(1),
  active: z.boolean(),
});
export const contactSchema = z
  .object({
    debtorId: z.string().min(1),
    debtId: z.string().min(1),
    channel: attendanceChannelSchema.optional(),
    result: z.enum([
      'Sem contato',
      'Contato realizado',
      'Retorno agendado',
      'Promessa de pagamento',
      'Encerrado',
    ]),
    note: z.string().trim().min(5, 'Descreva o atendimento (mínimo 5 caracteres).').max(2000),
    nextDate: z.string(),
    promiseAmount: z.number().nonnegative(),
  })
  .superRefine((v, c) => {
    if (v.result === 'Retorno agendado' && (!v.nextDate || v.nextDate < today()))
      c.addIssue({
        code: 'custom',
        path: ['nextDate'],
        message: 'Informe uma data de retorno válida.',
      });
    if (
      v.result === 'Promessa de pagamento' &&
      (v.promiseAmount <= 0 || !v.nextDate || v.nextDate < today())
    )
      c.addIssue({
        code: 'custom',
        path: ['promiseAmount'],
        message: 'Informe valor e data válidos para a promessa.',
      });
  });
export const PortfolioService = {
  save(scope: Scope, values: z.infer<typeof portfolioSchema>, portfolioId?: string) {
    return transact('Carteira salva', portfolioId || 'nova', scope, (db) => {
      requireRole(scope, ['Administrador'], db);
      const v = portfolioSchema.parse(values);
      if (scope.creditorId && scope.creditorId !== v.creditorId)
        throw new Error('Credor fora do contexto.');
      if (!db.creditors.some((c) => c.id === v.creditorId)) throw new Error('Credor inválido.');
      const existing = db.portfolios.find((p) => p.id === portfolioId);
      if (portfolioId && !existing) throw new Error('Carteira não encontrada.');
      if (existing) {
        if (existing.creditorId !== v.creditorId)
          throw new Error('Não ? permitido transferir carteira entre credores.');
        Object.assign(existing, v);
      } else db.portfolios.push({ ...v, id: id('pt'), createdAt: today() });
    });
  },
};
export const DebtorService = {
  block(scope: Scope, debtId: string) {
    return transact('Bloqueio operacional alterado', debtId, scope, (db) => {
      requireRole(scope, ['Administrador', 'Operador'], db);
      const debt = requireDebt(db, scope, debtId);
      const debtor = db.debtors.find((d) => d.id === debt.debtorId)!;
      debtor.blocked = !debtor.blocked;
    });
  },
};
export const CollectionService = {
  record(scope: Scope, values: z.infer<typeof contactSchema>) {
    return transact('Atendimento registrado', values.debtorId, scope, (db) => {
      requireRole(scope, ['Administrador', 'Operador'], db);
      const v = contactSchema.parse(values);
      const debt = requireDebt(db, scope, v.debtId);
      if (debt.debtorId !== v.debtorId || contactBlocked(db, debt))
        throw new Error('Devedor bloqueado ou dívida contestada/suspensa.');
      const creditorId = db.portfolios.find((p) => p.id === debt.portfolioId)!.creditorId;
      const channel = v.channel || 'Registro interno';
      const debtor = db.debtors.find((d) => d.id === v.debtorId)!;
      const destination =
        channel === 'Registro interno' ? undefined : contactDestination(debtor, channel);
      if (channel !== 'Registro interno' && !destination)
        throw new Error('Canal indisponível. Revise os dados de contato.');
      const contactId = id('ct');
      db.contacts.unshift({
        id: contactId,
        debtId: debt.id,
        actor: db.settings.operatorName,
        channel,
        destination: destination || undefined,
        debtorId: v.debtorId,
        creditorId,
        result: v.result,
        note: v.note,
        date: new Date().toISOString(),
        nextDate: v.nextDate || undefined,
        promiseAmount: v.promiseAmount || undefined,
        closed: v.result === 'Encerrado',
      });
      if (v.nextDate && (v.result === 'Retorno agendado' || v.result === 'Promessa de pagamento'))
        appendTask(
          db,
          { debtId: debt.id, title: `${v.result}: ${v.note}`.slice(0, 200), dueDate: v.nextDate },
          contactId,
        );
    });
  },
};
export const NegotiationService = {
  propose(scope: Scope, debtId: string, discount: number, entry: number, count: number) {
    return transact('Proposta simulada', debtId, scope, (db) => {
      if (!scope.debtorId) requireRole(scope, ['Administrador', 'Operador'], db);
      requireDebt(db, scope, debtId);
      const p = prepareProposal(db, debtId, discount, entry, count);
      db.proposals.push(p);
      return p;
    });
  },
  approve(scope: Scope, proposalId: string) {
    return transact('Aprovação excepcional demonstrativa', proposalId, scope, (db) => {
      requireRole(scope, ['Administrador'], db);
      const p = db.proposals.find((p) => p.id === proposalId);
      if (!p || p.status !== 'Aguardando aprovação')
        throw new Error('Proposta indisponível para aprovação.');
      requireDebt(db, scope, p.debtId);
      prepareProposal(db, p.debtId, p.discount, p.entry, p.count);
      p.approvedBy = db.settings.operatorName;
      p.status = 'Simulada';
    });
  },
  confirm(
    scope: Scope,
    debtId: string,
    discount: number,
    entry: number,
    count: number,
    proposalId?: string,
  ) {
    return transact('Acordo aceito', debtId, scope, (db) => {
      if (!scope.debtorId) requireRole(scope, ['Administrador', 'Operador'], db);
      requireDebt(db, scope, debtId);
      return createAgreement(
        db,
        debtId,
        discount,
        entry,
        count,
        scope.debtorId ? 'Aceite no portal demonstrativo' : db.settings.operatorName,
        proposalId,
      );
    });
  },
};
export const AgreementService = {
  cancel(scope: Scope, agreementId: string) {
    return transact('Acordo cancelado', agreementId, scope, (db) => {
      requireRole(scope, ['Administrador'], db);
      const a = db.agreements.find((a) => a.id === agreementId);
      if (!a) throw new Error('Acordo não encontrado.');
      requireDebt(db, scope, a.debtId);
      if (
        a.cancelled ||
        a.broken ||
        db.installments.some((i) => i.agreementId === a.id && i.paidAt)
      )
        throw new Error('Somente acordos sem recebimentos e não rompidos podem ser cancelados.');
      a.cancelled = true;
    });
  },
};
export const PaymentService = {
  reconcile(scope: Scope, installmentId: string, amount: number, reference: string) {
    return transact('Conciliação demonstrativa', installmentId, scope, (db) => {
      requireRole(scope, ['Administrador', 'Financeiro'], db);
      const i = db.installments.find((i) => i.id === installmentId);
      const a = db.agreements.find((a) => a.id === i?.agreementId);
      if (!i || !a || a.cancelled || a.broken || i.paidAt)
        throw new Error('Parcela indisponível para conciliação.');
      requireDebt(db, scope, a.debtId);
      if (!Number.isSafeInteger(amount) || amount <= 0 || reference.trim().length < 3)
        throw new Error('Informe valor positivo e referência (mínimo 3 caracteres).');
      if (db.installments.some((p) => p.paymentReference === reference.trim()))
        throw new Error('Referência já conciliada.');
      if (i.amount !== amount) {
        i.divergence = `Informado ${amount} centavos; esperado ${i.amount}. Referência: ${reference}`;
        return 'Divergência registrada. Nenhum pagamento foi confirmado.';
      }
      i.paidAt = today();
      i.paymentReference = reference.trim();
      delete i.divergence;
      return 'Pagamento demonstrativo confirmado diretamente ao credor.';
    });
  },
};
export const CampaignService = {
  create(scope: Scope, values: { name: string; creditorId: string; minDays: number }) {
    return transact('Campanha criada', 'nova', scope, (db) => {
      requireRole(scope, ['Administrador'], db);
      name.parse(values.name);
      if (
        !Number.isInteger(values.minDays) ||
        values.minDays < 0 ||
        !db.creditors.some((c) => c.id === values.creditorId) ||
        (scope.creditorId && scope.creditorId !== values.creditorId)
      )
        throw new Error('Segmentação inválida.');
      const audience = db.debts
        .filter(
          (d) =>
            db.portfolios.find((p) => p.id === d.portfolioId)?.creditorId === values.creditorId &&
            !contactBlocked(db, d) &&
            !activeAgreement(db, d.id) &&
            Math.floor((Date.parse(today()) - Date.parse(d.dueDate)) / 86400000) >= values.minDays,
        )
        .map((d) => d.id);
      db.campaigns.push({
        ...values,
        id: id('cp'),
        audience,
        status: 'Rascunho',
        createdAt: today(),
      });
    });
  },
  run(scope: Scope, campaignId: string) {
    return transact('Campanha simulada', campaignId, scope, (db) => {
      requireRole(scope, ['Administrador'], db);
      const c = db.campaigns.find((c) => c.id === campaignId);
      if (!c || (scope.creditorId && c.creditorId !== scope.creditorId))
        throw new Error('Campanha indisponível.');
      if (c.status !== 'Rascunho') throw new Error('Campanha já processada.');
      c.audience = c.audience.filter((debtId) => {
        const debt = requireDebt(db, { ...scope, creditorId: c.creditorId }, debtId);
        return (
          !contactBlocked(db, debt) &&
          !activeAgreement(db, debt.id) &&
          db.portfolios.find((p) => p.id === debt.portfolioId)?.active
        );
      });
      c.status = 'Simulada';
    });
  },
};
export function scopedDebts(db: Database, scope: Scope) {
  return db.debts.filter(
    (d) =>
      (!scope.creditorId ||
        db.portfolios.find((p) => p.id === d.portfolioId)?.creditorId === scope.creditorId) &&
      (!scope.debtorId || scope.debtorId === d.debtorId),
  );
}
