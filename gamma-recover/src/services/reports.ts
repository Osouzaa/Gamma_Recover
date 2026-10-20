import type { Database } from '../types/domain';
import { agreementStatus, metrics } from './domain';
import { csvCell, download, today } from '../utils/format';
export type ReportType =
  'Carteiras' | 'Acordos' | 'Recuperação' | 'Pagamentos' | 'Inadimplência' | 'Produtividade';
export const ReportService = {
  generate(db: Database, type: ReportType, creditorId: string, start: string, end: string) {
    const m = metrics(db, creditorId, start, end);
    const range = (d: string) => d.slice(0, 10) >= start && d.slice(0, 10) <= end;
    switch (type) {
      case 'Carteiras':
        return {
          headers: ['Carteira', 'Credor', 'Contratos', 'Saldo original (R$)'],
          rows: db.portfolios
            .filter((p) => (!creditorId || p.creditorId === creditorId) && range(p.createdAt))
            .map((p) => [
              p.name,
              db.creditors.find((c) => c.id === p.creditorId)?.name,
              m.debts.filter((d) => d.portfolioId === p.id).length,
              (
                m.debts.filter((d) => d.portfolioId === p.id).reduce((s, d) => s + d.amount, 0) /
                100
              ).toFixed(2),
            ]),
        };
      case 'Acordos':
        return {
          headers: ['Acordo', 'Contrato', 'Situação', 'Negociado (R$)'],
          rows: db.agreements
            .filter((a) => m.debts.some((d) => d.id === a.debtId) && range(a.createdAt))
            .map((a) => [
              a.id,
              db.debts.find((d) => d.id === a.debtId)?.reference,
              agreementStatus(db, a),
              (a.total / 100).toFixed(2),
            ]),
        };
      case 'Recuperação':
        return {
          headers: [
            'Credor',
            'Negociado no período (R$)',
            'Recebido no período (R$)',
            'Recuperação (%)',
          ],
          rows: db.creditors
            .filter((c) => !creditorId || c.id === creditorId)
            .map((c) => {
              const cm = metrics(db, c.id, start, end);
              return [
                c.name,
                (cm.negotiated / 100).toFixed(2),
                (cm.received / 100).toFixed(2),
                cm.recovery.toFixed(2),
              ];
            }),
        };
      case 'Pagamentos':
        return {
          headers: ['Parcela', 'Acordo', 'Data recebimento', 'Recebido (R$)'],
          rows: m.installments
            .filter((i) => i.paidAt && range(i.paidAt))
            .map((i) => [i.id, i.agreementId, i.paidAt, (i.amount / 100).toFixed(2)]),
        };
      case 'Inadimplência':
        return {
          headers: ['Parcela', 'Acordo', 'Vencimento', 'Vencido (R$)'],
          rows: m.installments
            .filter(
              (i) =>
                !i.paidAt &&
                i.dueDate < today() &&
                range(i.dueDate) &&
                !m.agreements.find((a) => a.id === i.agreementId)?.broken,
            )
            .map((i) => [i.id, i.agreementId, i.dueDate, (i.amount / 100).toFixed(2)]),
        };
      case 'Produtividade':
        return {
          headers: ['Atendimento', 'Resultado', 'Data', 'Devedor', 'Contrato', 'Operador'],
          rows: db.contacts
            .filter((c) => (!creditorId || c.creditorId === creditorId) && range(c.date))
            .map((c) => [
              c.id,
              c.result,
              c.date,
              db.debtors.find((d) => d.id === c.debtorId)?.name,
              db.debts.find((d) => d.id === c.debtId)?.reference || 'Não vinculado (legado)',
              c.actor || 'Não identificado (legado)',
            ]),
        };
    }
  },
  export(headers: string[], rows: unknown[][], type: ReportType) {
    download(
      `gamma-${type.toLowerCase()}.csv`,
      [headers, ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n'),
    );
  },
};
