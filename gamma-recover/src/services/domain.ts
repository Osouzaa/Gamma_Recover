import type { Agreement, Database, Debt, Policy, Proposal } from '../types/domain';
import { addMonths, id, today } from '../utils/format';
export const creditorOf = (db: Database, debt: Debt) =>
  db.portfolios.find((p) => p.id === debt.portfolioId)!.creditorId;
export const agreementStatus = (db: Database, agreement: Agreement) => {
  if (agreement.cancelled) return 'Cancelado';
  if (agreement.broken) return 'Rompido';
  const items = db.installments.filter((i) => i.agreementId === agreement.id);
  if (items.length && items.every((i) => i.paidAt)) return 'Cumprido';
  if (items.some((i) => !i.paidAt && i.dueDate < today())) return 'Em atraso';
  return items.length ? 'Ativo' : 'Pendente';
};
export const activeAgreement = (db: Database, debtId: string) =>
  db.agreements.find((a) => a.debtId === debtId && !a.cancelled);
export const isSuspended = (debt: Debt) => debt.suspensionHistory?.at(-1)?.suspended === true;
export const contactBlocked = (db: Database, debt: Debt) =>
  !!db.debtors.find((d) => d.id === debt.debtorId)?.blocked || debt.disputed || isSuspended(debt);
export function simulate(
  amount: number,
  discount: number,
  entry: number,
  count: number,
  policy: Policy,
) {
  if (
    ![amount, discount, entry, count].every(Number.isFinite) ||
    !Number.isSafeInteger(amount) ||
    amount <= 0
  )
    throw new Error('Valores financeiros inválidos.');
  if (discount < 0 || discount > policy.maxDiscount)
    throw new Error(`Desconto máximo permitido: ${policy.maxDiscount}%.`);
  if (!Number.isInteger(count) || count < 1 || count > policy.maxInstallments)
    throw new Error(`Informe entre 1 e ${policy.maxInstallments} parcelas.`);
  const total = amount - Math.round((amount * discount) / 100);
  if (!Number.isSafeInteger(entry) || entry < 0 || entry >= total)
    throw new Error('A entrada deve ser menor que o total negociado.');
  const remainder = total - entry;
  if (Math.floor(remainder / count) < policy.minInstallment)
    throw new Error('Parcela abaixo do mínimo da política.');
  const amounts = Array.from(
    { length: count },
    (_, i) => Math.floor(remainder / count) + (i === count - 1 ? remainder % count : 0),
  );
  return { total, amounts, entry, discount, count };
}
export function prepareProposal(
  db: Database,
  debtId: string,
  discount: number,
  entry: number,
  count: number,
): Proposal {
  const debt = db.debts.find((d) => d.id === debtId);
  if (!debt) throw new Error('Dívida não encontrada.');
  if (contactBlocked(db, debt)) throw new Error('Dívida bloqueada para negociação.');
  if (!db.portfolios.find((p) => p.id === debt.portfolioId)?.active)
    throw new Error('Carteira inativa.');
  if (activeAgreement(db, debtId)) throw new Error('Esta dívida já possui acordo.');
  const creditor = db.creditors.find((c) => c.id === creditorOf(db, debt))!;
  const result = simulate(debt.amount, discount, entry, count, creditor.policy);
  return {
    id: id('pr'),
    debtId,
    discount,
    entry,
    count,
    total: result.total,
    createdAt: today(),
    status:
      discount > (creditor.policy.approvalAbove ?? creditor.policy.maxDiscount)
        ? 'Aguardando aprovação'
        : 'Simulada',
  };
}
export function createAgreement(
  db: Database,
  debtId: string,
  discount: number,
  entry: number,
  count: number,
  acceptedBy: string,
  proposalId?: string,
) {
  const prepared = prepareProposal(db, debtId, discount, entry, count);
  const saved = proposalId ? db.proposals.find((p) => p.id === proposalId) : undefined;
  if (
    proposalId &&
    (!saved ||
      saved.debtId !== debtId ||
      saved.discount !== discount ||
      saved.entry !== entry ||
      saved.count !== count ||
      saved.total !== prepared.total ||
      saved.status !== 'Simulada')
  )
    throw new Error('Proposta indisponível ou condições alteradas. Simule novamente.');
  if (prepared.status === 'Aguardando aprovação' && !saved?.approvedBy)
    throw new Error('Esta condição exige aprovação demonstrativa do administrador.');
  const proposal = saved || prepared;
  proposal.status = 'Aceita';
  if (!saved) db.proposals.push(proposal);
  const debt = db.debts.find((d) => d.id === debtId)!;
  const policy = db.creditors.find((c) => c.id === creditorOf(db, debt))!.policy;
  const result = simulate(debt.amount, discount, entry, count, policy);
  const agreement: Agreement = {
    id: id('ac'),
    debtId,
    proposalId: proposal.id,
    total: result.total,
    createdAt: today(),
    cancelled: false,
    broken: false,
    acceptedBy,
  };
  db.agreements.push(agreement);
  if (entry)
    db.installments.push({
      id: id('pc'),
      agreementId: agreement.id,
      number: 0,
      amount: entry,
      dueDate: today(),
    });
  result.amounts.forEach((amount, i) =>
    db.installments.push({
      id: id('pc'),
      agreementId: agreement.id,
      number: i + 1,
      amount,
      dueDate: addMonths(today(), entry ? i + 1 : i),
    }),
  );
  return agreement;
}
export function metrics(db: Database, creditorId = '', start = '', end = today()) {
  const debts = db.debts.filter((d) => !creditorId || creditorOf(db, d) === creditorId);
  const agreements = db.agreements.filter(
    (a) => debts.some((d) => d.id === a.debtId) && !a.cancelled,
  );
  const installments = db.installments.filter((i) =>
    agreements.some((a) => a.id === i.agreementId),
  );
  const received = installments
    .filter((i) => i.paidAt && i.paidAt.slice(0, 10) >= start && i.paidAt.slice(0, 10) <= end)
    .reduce((s, i) => s + i.amount, 0);
  const managed = debts.reduce((s, d) => s + d.amount, 0);
  return {
    managed,
    eligible: debts
      .filter(
        (d) =>
          !contactBlocked(db, d) &&
          !activeAgreement(db, d.id) &&
          db.portfolios.find((p) => p.id === d.portfolioId)?.active,
      )
      .reduce((s, d) => s + d.amount, 0),
    negotiated: agreements
      .filter((a) => a.createdAt >= start && a.createdAt <= end)
      .reduce((s, a) => s + a.total, 0),
    received,
    overdue: installments
      .filter(
        (i) =>
          !i.paidAt &&
          i.dueDate < today() &&
          !agreements.find((a) => a.id === i.agreementId)?.broken,
      )
      .reduce((s, i) => s + i.amount, 0),
    recovery: managed ? (received / managed) * 100 : 0,
    agreements,
    installments,
    debts,
  };
}
