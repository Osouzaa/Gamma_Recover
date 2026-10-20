import type { Database } from '../types/domain';
import { agreementStatus, creditorOf, metrics } from './domain';
import {
  dashboardBuckets,
  dashboardWindow,
  inRange,
  type DashboardPeriod,
} from './dashboardPeriods';
import { addDays, today } from '../utils/format';
const reachedResults = new Set(['Contato realizado', 'Retorno agendado', 'Promessa de pagamento']);
export function variation(value: number, previous: number, hasHistory: boolean) {
  return hasHistory && previous > 0 ? ((value - previous) / previous) * 100 : undefined;
}
export const DashboardService = {
  overview(db: Database, creditorId: string, period: DashboardPeriod, asOf = today()) {
    const window = dashboardWindow(db, period, asOf);
    const current = metrics(db, creditorId, window.start, window.end);
    const debtIds = new Set(current.debts.map((d) => d.id));
    const personIds = new Set(current.debts.map((d) => d.debtorId));
    const agreements = db.agreements.filter((a) => debtIds.has(a.debtId));
    const previous = window.previousStart
      ? metrics(db, creditorId, window.previousStart, window.previousEnd)
      : undefined;
    const previousPayments =
      previous?.installments.filter(
        (i) => i.paidAt && inRange(i.paidAt, window.previousStart!, window.previousEnd!),
      ) || [];
    const previousAgreements =
      previous?.agreements.filter((a) =>
        inRange(a.createdAt, window.previousStart!, window.previousEnd!),
      ) || [];
    const contacts = db.contacts.filter(
      (c) =>
        personIds.has(c.debtorId) &&
        (!creditorId || c.creditorId === creditorId) &&
        inRange(c.date, window.start, window.end),
    );
    const previousContacts = window.previousStart
      ? db.contacts.filter(
          (c) =>
            personIds.has(c.debtorId) &&
            (!creditorId || c.creditorId === creditorId) &&
            inRange(c.date, window.previousStart!, window.previousEnd!),
        )
      : [];
    const reached = contacts.filter((c) => reachedResults.has(c.result));
    const previousReached = previousContacts.filter((c) => reachedResults.has(c.result));
    const efficiency = contacts.length ? (reached.length / contacts.length) * 100 : undefined;
    const previousEfficiency = previousContacts.length
      ? (previousReached.length / previousContacts.length) * 100
      : undefined;
    const states = ['Ativo', 'Em atraso', 'Cumprido', 'Rompido', 'Pendente', 'Cancelado'].map(
      (name) => ({ name, count: agreements.filter((a) => agreementStatus(db, a) === name).length }),
    );
    const active = states.find((s) => s.name === 'Ativo')!.count;
    const late = states.find((s) => s.name === 'Em atraso')!.count;
    const openIds = new Set(current.agreements.filter((a) => !a.broken).map((a) => a.id));
    const outstanding = current.installments.filter((i) => openIds.has(i.agreementId) && !i.paidAt);
    const nextDue = outstanding
      .filter((i) => i.dueDate >= asOf && i.dueDate <= addDays(asOf, 7))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const divergences = outstanding.filter((i) => i.divergence);
    const pendingApprovals = db.proposals.filter(
      (p) => debtIds.has(p.debtId) && p.status === 'Aguardando aprovação',
    );
    const contactedIds = new Set(contacts.map((c) => c.debtorId));
    const reachedIds = new Set(reached.map((c) => c.debtorId));
    const currentAgreements = current.agreements.filter((a) =>
      inRange(a.createdAt, window.start, window.end),
    );
    const agreedIds = new Set(
      currentAgreements
        .map((a) => db.debts.find((d) => d.id === a.debtId)!.debtorId)
        .filter((id) => reachedIds.has(id)),
    );
    const funnel = [
      { name: 'Pessoas na carteira', count: personIds.size },
      { name: 'Acionadas no período', count: contactedIds.size },
      { name: 'Com contato efetivo', count: reachedIds.size },
      { name: 'Com contato e acordo', count: agreedIds.size },
    ];
    const series = dashboardBuckets(window, period).map((bucket) => ({
      ...bucket,
      received: current.installments
        .filter((i) => i.paidAt && inRange(i.paidAt, bucket.start, bucket.end))
        .reduce((s, i) => s + i.amount, 0),
      previous: previousPayments.length
        ? previousPayments
            .filter((i) => inRange(i.paidAt!, bucket.previousStart!, bucket.previousEnd!))
            .reduce((s, i) => s + i.amount, 0)
        : undefined,
    }));
    const creditors = db.creditors
      .filter((c) => !creditorId || c.id === creditorId)
      .map((c) => {
        const debts = current.debts.filter((d) => creditorOf(db, d) === c.id);
        const amount = debts.reduce((s, d) => s + d.amount, 0);
        return {
          id: c.id,
          name: c.name,
          amount,
          count: debts.length,
          share: current.managed ? (amount / current.managed) * 100 : 0,
        };
      });
    return {
      window,
      current,
      previous,
      states,
      active,
      late,
      delinquency: active + late ? (late / (active + late)) * 100 : undefined,
      contacts,
      reached,
      efficiency,
      previousEfficiency,
      series,
      creditors,
      funnel,
      nextDue,
      divergences,
      pendingApprovals,
      receivedVariation: variation(
        current.received,
        previous?.received || 0,
        previousPayments.length > 0,
      ),
      negotiatedVariation: variation(
        current.negotiated,
        previous?.negotiated || 0,
        previousAgreements.length > 0,
      ),
      recentAgreements: agreements
        .filter((a) => inRange(a.createdAt, window.start, window.end))
        .reverse()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      blocked: current.debts.filter((d) => db.debtors.find((v) => v.id === d.debtorId)?.blocked)
        .length,
      disputed: current.debts.filter((d) => d.disputed).length,
    };
  },
};
export type DashboardOverview = ReturnType<typeof DashboardService.overview>;
