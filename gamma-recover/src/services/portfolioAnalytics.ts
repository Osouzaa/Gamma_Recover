import type { Database } from '../types/domain';
import { activeAgreement, contactBlocked, creditorOf } from './domain';
import { locationKey, locationLabel } from './location';
import { addDays, addMonths, csvCell, today } from '../utils/format';
export type AnalysisBasis = 'combined' | 'debts' | 'installments';
export type Maturity = 'all' | 'upcoming' | 'overdue' | 'under5' | 'older5';
export interface AnalysisFilters {
  creditorId: string;
  portfolioId: string;
  city: string;
  basis: AnalysisBasis;
  maturity: Maturity;
}
export const defaultAnalysisFilters: AnalysisFilters = {
  creditorId: '',
  portfolioId: '',
  city: '',
  basis: 'combined',
  maturity: 'all',
};
export function portfolioAnalytics(db: Database, filters: AnalysisFilters, asOf = today()) {
  const cutoff = addMonths(asOf, -60);
  const withinScope = db.debts.filter(
    (d) =>
      (!filters.creditorId || creditorOf(db, d) === filters.creditorId) &&
      (!filters.portfolioId || d.portfolioId === filters.portfolioId),
  );
  const records = withinScope.flatMap((debt) => {
    const debtor = db.debtors.find((d) => d.id === debt.debtorId)!;
    const portfolio = db.portfolios.find((p) => p.id === debt.portfolioId)!;
    const creditor = db.creditors.find((c) => c.id === portfolio.creditorId)!;
    const common = {
      debtId: debt.id,
      reference: debt.reference,
      debtorId: debtor.id,
      name: debtor.name,
      company: creditor.name,
      portfolio: portfolio.name,
      cityKey: locationKey(debtor.location),
      city: locationLabel(debtor.location),
      knownLocation: !!debtor.location,
    };
    if (filters.basis !== 'installments' && !activeAgreement(db, debt.id))
      return [
        {
          ...common,
          id: debt.id,
          amount: debt.amount,
          dueDate: debt.dueDate,
          eligible: !contactBlocked(db, debt) && portfolio.active,
          installment: '',
        },
      ];
    if (filters.basis === 'debts') return [];
    return db.installments
      .filter(
        (i) =>
          !i.paidAt &&
          db.agreements.some(
            (a) => a.id === i.agreementId && a.debtId === debt.id && !a.cancelled && !a.broken,
          ),
      )
      .map((i) => ({
        ...common,
        id: i.id,
        amount: i.amount,
        dueDate: i.dueDate,
        eligible: false,
        installment: i.number === 0 ? 'Entrada' : String(i.number),
      }));
  });
  const cities = [
    ...new Map(records.map((r) => [r.cityKey, { key: r.cityKey, name: r.city }])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const rows = records
    .filter(
      (r) =>
        (!filters.city || r.cityKey === filters.city) &&
        (filters.maturity === 'all' ||
          (filters.maturity === 'upcoming' && r.dueDate >= asOf) ||
          (filters.maturity === 'overdue' && r.dueDate < asOf) ||
          (filters.maturity === 'under5' && r.dueDate < asOf && r.dueDate > cutoff) ||
          (filters.maturity === 'older5' && r.dueDate <= cutoff)),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
  const sum = (items: typeof rows) => items.reduce((total, r) => total + r.amount, 0);
  const total = sum(rows);
  const overdue = sum(rows.filter((r) => r.dueDate < asOf));
  const upcoming = sum(rows.filter((r) => r.dueDate >= asOf));
  const under5 = sum(rows.filter((r) => r.dueDate < asOf && r.dueDate > cutoff));
  const older5 = sum(rows.filter((r) => r.dueDate <= cutoff));
  const bounds = [
    asOf,
    addDays(asOf, -30),
    addDays(asOf, -90),
    addDays(asOf, -180),
    addDays(asOf, -365),
    addMonths(asOf, -24),
    cutoff,
  ];
  const labels = [
    'A vencer / hoje',
    '1–30 dias',
    '31–90 dias',
    '91–180 dias',
    '181–365 dias',
    '366 dias–2 anos',
    'Mais de 2 e menos de 5 anos',
    '5 anos ou mais',
  ];
  const aging = labels.map((name, index) => {
    const items = rows.filter((r) =>
      index === 0
        ? r.dueDate >= asOf
        : index === 7
          ? r.dueDate <= cutoff
          : r.dueDate < bounds[index - 1] && r.dueDate >= bounds[index],
    );
    // O aniversário exato de cinco anos pertence exclusivamente à última faixa.
    const exact = index === 6 ? items.filter((r) => r.dueDate > cutoff) : items;
    return { name, amount: sum(exact), count: exact.length };
  });
  const geography = [...new Set(rows.map((r) => r.cityKey))]
    .map((key) => {
      const items = rows.filter((r) => r.cityKey === key);
      const amount = sum(items);
      return {
        key,
        name: items[0].city,
        amount,
        overdue: sum(items.filter((r) => r.dueDate < asOf)),
        count: items.length,
        people: new Set(items.map((r) => r.debtorId)).size,
        share: total ? (amount / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'pt-BR'));
  const forecast = Array.from({ length: 6 }, (_, index) => {
    const start = addMonths(`${asOf.slice(0, 7)}-01`, index);
    const end = addMonths(start, 1);
    const items = rows.filter((r) => r.dueDate >= asOf && r.dueDate >= start && r.dueDate < end);
    return { month: start.slice(0, 7), amount: sum(items), count: items.length };
  });
  const known = sum(rows.filter((r) => r.knownLocation));
  return {
    asOf,
    cutoff,
    filters,
    cities,
    rows,
    total,
    overdue,
    upcoming,
    under5,
    older5,
    aging,
    geography,
    forecast,
    dueToday: sum(rows.filter((r) => r.dueDate === asOf)),
    next30: sum(rows.filter((r) => r.dueDate >= asOf && r.dueDate <= addDays(asOf, 30))),
    eligible: sum(rows.filter((r) => r.eligible)),
    contracts: new Set(rows.map((r) => r.debtId)).size,
    people: new Set(rows.map((r) => r.debtorId)).size,
    locationCoverage: total ? (known / total) * 100 : undefined,
    overdueShare: total ? (overdue / total) * 100 : undefined,
  };
}
export type PortfolioAnalysis = ReturnType<typeof portfolioAnalytics>;
export function analysisCSV(analysis: PortfolioAnalysis) {
  return [
    [
      'Data de referência',
      'Base',
      'Empresa',
      'Carteira',
      'Contrato',
      'Parcela',
      'Devedor fictício',
      'Cidade / UF',
      'Vencimento',
      'Valor (BRL)',
      'Situação',
    ],
    ...analysis.rows.map((r) => [
      analysis.asOf,
      r.installment ? 'Parcelas em aberto' : 'Dívidas sem acordo',
      r.company,
      r.portfolio,
      r.reference,
      r.installment,
      r.name,
      r.city,
      r.dueDate,
      (r.amount / 100).toFixed(2),
      r.dueDate < analysis.asOf
        ? 'Vencido'
        : r.dueDate === analysis.asOf
          ? 'Vence hoje'
          : 'A vencer',
    ]),
  ]
    .map((row) => row.map(csvCell).join(';'))
    .join('\r\n');
}
