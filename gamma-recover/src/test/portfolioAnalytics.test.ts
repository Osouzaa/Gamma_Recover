import { describe, expect, it } from 'vitest';
import { seed } from '../mocks/seed';
import {
  analysisCSV,
  defaultAnalysisFilters as defaults,
  portfolioAnalytics,
} from '../services/portfolioAnalytics';
import { activeAgreement } from '../services/domain';
import { addDays, today } from '../utils/format';
describe('análise de carteira por vencimento e território', () => {
  it('consolida sem dupla contagem, preserva a base e reconcilia gráficos e indicadores', () => {
    const db = seed();
    const before = structuredClone(db);
    const result = portfolioAnalytics(db, defaults);
    const originals = db.debts
      .filter((d) => !activeAgreement(db, d.id))
      .reduce((s, d) => s + d.amount, 0);
    const open = db.installments
      .filter(
        (i) =>
          !i.paidAt &&
          db.agreements.some((a) => a.id === i.agreementId && !a.cancelled && !a.broken),
      )
      .reduce((s, i) => s + i.amount, 0);
    expect(result.total).toBe(originals + open);
    expect(result.upcoming + result.overdue).toBe(result.total);
    expect(result.under5 + result.older5).toBe(result.overdue);
    expect(result.aging.reduce((s, r) => s + r.amount, 0)).toBe(result.total);
    expect(result.aging.reduce((s, r) => s + r.count, 0)).toBe(result.rows.length);
    expect(result.geography.reduce((s, r) => s + r.amount, 0)).toBe(result.total);
    expect(db).toEqual(before);
  });
  it('separa hoje, datas futuras, cinco anos completos e aniversário de ano bissexto', () => {
    const db = seed();
    db.agreements = [];
    db.installments = [];
    const dates = [
      '2026-10-20',
      '2026-10-21',
      '2026-10-19',
      '2021-10-21',
      '2021-10-20',
      '2021-10-19',
    ];
    db.debts = dates.map((dueDate, index) => ({
      ...db.debts[9],
      id: `date-${index}`,
      dueDate,
      amount: 100,
    }));
    const result = portfolioAnalytics(db, defaults, '2026-10-20');
    expect(result).toMatchObject({
      total: 600,
      dueToday: 100,
      upcoming: 200,
      overdue: 400,
      under5: 200,
      older5: 200,
    });
    expect(
      portfolioAnalytics(db, { ...defaults, maturity: 'under5' }, '2026-10-20').rows.map(
        (r) => r.dueDate,
      ),
    ).toEqual(['2021-10-21', '2026-10-19']);
    expect(result.aging.at(-1)?.amount).toBe(200);
    expect(result.aging.reduce((s, r) => s + r.amount, 0)).toBe(600);
    expect(portfolioAnalytics(db, defaults, '2024-02-29').cutoff).toBe('2019-02-28');
  });
  it('isola empresa/carteira/cidade e conserva valores sem localização', () => {
    const db = seed();
    delete db.debtors[9].location;
    const all = portfolioAnalytics(db, defaults);
    const missing = portfolioAnalytics(db, { ...defaults, city: 'unknown' });
    expect(missing.rows.every((r) => r.city === 'Localização não informada')).toBe(true);
    expect(missing.total).toBe(all.geography.find((r) => r.key === 'unknown')?.amount);
    const scoped = portfolioAnalytics(db, { ...defaults, creditorId: 'cr-2', portfolioId: 'pt-1' });
    expect(scoped.rows).toEqual([]);
    expect(scoped.locationCoverage).toBeUndefined();
    expect(scoped.overdueShare).toBeUndefined();
    const city = all.cities.find((c) => c.key !== 'unknown')!;
    const selected = portfolioAnalytics(db, { ...defaults, city: city.key });
    expect(selected.rows.every((r) => r.cityKey === city.key)).toBe(true);
    expect(selected.locationCoverage).toBe(100);
  });
  it('exclui recebidos, cancelados e rompidos das parcelas e distingue dívidas sem acordo', () => {
    const db = seed();
    db.agreements[0].cancelled = true;
    db.agreements[1].broken = true;
    const installments = portfolioAnalytics(db, { ...defaults, basis: 'installments' });
    expect(installments.rows.every((r) => r.installment !== '')).toBe(true);
    expect(
      installments.rows.some(
        (r) => r.debtId === db.agreements[0].debtId || r.debtId === db.agreements[1].debtId,
      ),
    ).toBe(false);
    const debts = portfolioAnalytics(db, { ...defaults, basis: 'debts' });
    expect(debts.rows.some((r) => r.debtId === db.agreements[0].debtId)).toBe(true);
    expect(debts.rows.some((r) => r.debtId === db.agreements[1].debtId)).toBe(false);
    expect(installments.total + debts.total).toBe(portfolioAnalytics(db, defaults).total);
  });
  it('agenda apenas vencimentos futuros e exporta exatamente os registros filtrados com CSV seguro', () => {
    const db = seed();
    db.debts[9].dueDate = addDays(today(), 1);
    db.debtors[9].name = '=DEMO-FORMULA';
    const result = portfolioAnalytics(db, { ...defaults, basis: 'debts', maturity: 'upcoming' });
    expect(result.forecast.reduce((s, r) => s + r.amount, 0)).toBe(result.total);
    expect(result.next30).toBeGreaterThan(0);
    const csv = analysisCSV(result);
    expect(csv.split('\r\n')).toHaveLength(result.rows.length + 1);
    expect(csv).toContain("'=DEMO-FORMULA");
    expect(csv).toContain('Dívidas sem acordo');
    expect(
      portfolioAnalytics(db, { ...defaults, maturity: 'overdue' }).forecast.every(
        (r) => r.amount === 0,
      ),
    ).toBe(true);
  });
  it('não transforma suspensão em baixa financeira e mantém bases legadas sem localização', () => {
    const db = seed();
    const before = portfolioAnalytics(db, defaults);
    db.debts[9].suspensionHistory = [
      {
        suspended: true,
        reason: 'Revisão solicitada.',
        actor: 'Demo',
        date: new Date().toISOString(),
      },
    ];
    db.debtors.forEach((d) => {
      delete d.location;
    });
    const result = portfolioAnalytics(db, defaults);
    expect(result.total).toBe(before.total);
    expect(result.eligible).toBe(before.eligible - db.debts[9].amount);
    expect(result.geography).toHaveLength(1);
    expect(result.locationCoverage).toBe(0);
  });
});
